import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, realpath, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasCoursePermission } from "@/lib/permissions";
import { isUserRole } from "@/lib/roles";
import { listCoursesForUser } from "@/lib/course-query";
import {
  getCourseAssetMimeType,
  isAllowedCourseAssetFile,
  isCourseAssetKind,
  isValidCourseAssetId,
} from "@/lib/course-asset-storage";
import {
  CourseMaterialUploadError,
  courseMaterialExtensions,
  isCourseMaterialPathInside,
  maxCourseMaterialSize,
  parseCourseMaterialUpload,
} from "@/lib/course-material-upload";

type RouteContext = { params: Promise<{ courseId: string; kind: string }> };
type ByteRange = { start: number; end: number };

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function parseByteRange(value: string | null, size: number): ByteRange | null | undefined {
  if (!value) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || size === 0 || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start < 0 ||
    start >= size ||
    requestedEnd < start
  ) {
    return null;
  }
  return { start, end: Math.min(requestedEnd, size - 1) };
}

async function getActor(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true, mustChangePassword: true },
  });
}

async function getCourseDirectory(courseId: string, create: boolean) {
  if (!isValidCourseAssetId(courseId)) return null;
  const storageRoot = path.resolve(process.cwd(), "storage", "course-assets");
  if (create) await mkdir(storageRoot, { recursive: true, mode: 0o700 });
  let realStorageRoot: string;
  try {
    realStorageRoot = await realpath(storageRoot);
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
  const directory = path.resolve(realStorageRoot, courseId);
  if (!isCourseMaterialPathInside(realStorageRoot, directory)) return null;
  if (create) await mkdir(directory, { recursive: true, mode: 0o700 });
  try {
    const stats = await lstat(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) return null;
    const realDirectory = await realpath(directory);
    if (
      realDirectory !== directory ||
      !isCourseMaterialPathInside(realStorageRoot, realDirectory)
    ) {
      return null;
    }
    return { realStorageRoot, realDirectory };
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }
  const session = await getSession();
  const role = session?.user.role ?? "";
  if (!session || !isUserRole(role) || !hasCoursePermission(role, "write")) {
    return NextResponse.json({ message: "You cannot upload course media." }, { status: 403 });
  }
  const actor = await getActor(session.user.id);
  if (!actor || actor.banned) {
    return NextResponse.json({ message: "This account cannot access courses." }, { status: 401 });
  }
  if (actor.mustChangePassword) {
    return NextResponse.json({ message: "Change your password to continue." }, { status: 403 });
  }

  const { courseId, kind } = await params;
  if (!isCourseAssetKind(kind) || !isValidCourseAssetId(courseId)) {
    return NextResponse.json(
      { message: "The selected course media target is invalid." },
      { status: 400 },
    );
  }
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { isMock: true },
  });
  if (!course || course.isMock) {
    return NextResponse.json({ message: "The selected course was not found." }, { status: 404 });
  }

  const directory = await getCourseDirectory(courseId, true);
  if (!directory) {
    return NextResponse.json(
      { message: "The course media folder is unavailable." },
      { status: 500 },
    );
  }
  const tempFilePath = path.join(directory.realDirectory, `.upload-${randomUUID()}.tmp`);
  let storedFilePath: string | null = null;
  try {
    const upload = await parseCourseMaterialUpload(request, tempFilePath);
    const extension = path.extname(upload.fileName).toLowerCase();
    if (!upload.fileName || !courseMaterialExtensions.has(extension)) {
      return NextResponse.json(
        { message: "This media file type is not allowed." },
        { status: 400 },
      );
    }
    if (upload.fileSize < 1 || upload.fileSize > maxCourseMaterialSize) {
      return NextResponse.json(
        { message: "Course media files must be smaller than 20 MB." },
        { status: 413 },
      );
    }
    if (!getCourseAssetMimeType(kind, extension)) {
      return NextResponse.json(
        {
          message:
            kind === "cover"
              ? "Choose a JPG or PNG image for the course cover."
              : "Choose an MP4 or WebM video for the course promotion.",
        },
        { status: 400 },
      );
    }

    const fileHandle = await open(tempFilePath, "r");
    let fileHeader: Buffer;
    try {
      fileHeader = Buffer.alloc(16);
      const { bytesRead } = await fileHandle.read(fileHeader, 0, fileHeader.length, 0);
      fileHeader = fileHeader.subarray(0, bytesRead);
    } finally {
      await fileHandle.close();
    }
    if (!isAllowedCourseAssetFile(kind, extension, fileHeader)) {
      return NextResponse.json(
        { message: "The file contents do not match the selected media type." },
        { status: 400 },
      );
    }

    const extensions = kind === "cover" ? [".jpg", ".jpeg", ".png"] : [".mp4", ".webm"];
    for (const existingExtension of extensions) {
      try {
        await unlink(path.join(directory.realDirectory, `${kind}${existingExtension}`));
      } catch (error) {
        if (!isMissingFileError(error)) throw error;
      }
    }

    const filePath = path.join(directory.realDirectory, `${kind}${extension}`);
    await rename(tempFilePath, filePath);
    storedFilePath = filePath;
    storedFilePath = null;
    return NextResponse.json(
      { url: `/api/course-media/${courseId}/${kind}` },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof CourseMaterialUploadError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  } finally {
    if (storedFilePath) await unlink(storedFilePath);
    try {
      await unlink(tempFilePath);
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
    }
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }
  const session = await getSession();
  const role = session?.user.role ?? "";
  if (!session || !isUserRole(role) || !hasCoursePermission(role, "write")) {
    return NextResponse.json({ message: "You cannot remove course media." }, { status: 403 });
  }
  const actor = await getActor(session.user.id);
  if (!actor || actor.banned) {
    return NextResponse.json({ message: "This account cannot access courses." }, { status: 401 });
  }
  if (actor.mustChangePassword) {
    return NextResponse.json({ message: "Change your password to continue." }, { status: 403 });
  }

  const { courseId, kind } = await params;
  if (!isCourseAssetKind(kind) || !isValidCourseAssetId(courseId)) {
    return NextResponse.json(
      { message: "The selected course media target is invalid." },
      { status: 400 },
    );
  }
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { isMock: true },
  });
  if (!course || course.isMock) {
    return NextResponse.json({ message: "The selected course was not found." }, { status: 404 });
  }

  const directory = await getCourseDirectory(courseId, false);
  if (directory) {
    const extensions = kind === "cover" ? [".jpg", ".jpeg", ".png"] : [".mp4", ".webm"];
    for (const extension of extensions) {
      try {
        await unlink(path.join(directory.realDirectory, `${kind}${extension}`));
      } catch (error) {
        if (!isMissingFileError(error)) throw error;
      }
    }
  }
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET(request: Request, { params }: RouteContext) {
  const session = await getSession();
  const role = session?.user.role ?? "";
  if (!session || !isUserRole(role) || !hasCoursePermission(role, "read")) {
    return NextResponse.json({ message: "You cannot view course media." }, { status: 403 });
  }
  const actor = await getActor(session.user.id);
  if (!actor || actor.banned) {
    return NextResponse.json({ message: "This account cannot access courses." }, { status: 401 });
  }
  if (actor.mustChangePassword) {
    return NextResponse.json({ message: "Change your password to continue." }, { status: 403 });
  }

  const { courseId, kind } = await params;
  if (!isCourseAssetKind(kind) || !isValidCourseAssetId(courseId)) {
    return NextResponse.json({ message: "Course media not found." }, { status: 404 });
  }
  const result = await listCoursesForUser(session.user.id, role, 1, 1, "", courseId);
  const course = result.courses.find((item) => item.id === courseId && !item.isMock);
  if (!course) return NextResponse.json({ message: "Course media not found." }, { status: 404 });

  const directory = await getCourseDirectory(courseId, false);
  if (!directory) return NextResponse.json({ message: "Course media not found." }, { status: 404 });
  const extensions = kind === "cover" ? [".jpg", ".jpeg", ".png"] : [".mp4", ".webm"];
  let mediaPath: string | null = null;
  let mediaExtension: string | null = null;
  for (const extension of extensions) {
    const candidate = path.join(directory.realDirectory, `${kind}${extension}`);
    try {
      const stats = await lstat(candidate);
      if (!stats.isFile() || stats.isSymbolicLink()) continue;
      const realFilePath = await realpath(candidate);
      if (!isCourseMaterialPathInside(directory.realStorageRoot, realFilePath)) continue;
      mediaPath = realFilePath;
      mediaExtension = extension;
      break;
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
    }
  }
  if (!mediaPath || !mediaExtension) {
    return NextResponse.json({ message: "Course media not found." }, { status: 404 });
  }
  const contentType = getCourseAssetMimeType(kind, mediaExtension);
  if (!contentType) {
    return NextResponse.json({ message: "Course media not found." }, { status: 404 });
  }

  const fileHandle = await open(/* turbopackIgnore: true */ mediaPath, "r");
  let stats: Awaited<ReturnType<typeof fileHandle.stat>>;
  try {
    stats = await fileHandle.stat();
  } catch (error) {
    await fileHandle.close();
    throw error;
  }
  if (!stats.isFile()) {
    await fileHandle.close();
    return NextResponse.json({ message: "Course media not found." }, { status: 404 });
  }

  const range = parseByteRange(request.headers.get("range"), stats.size);
  if (range === null) {
    await fileHandle.close();
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${stats.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  const start = range?.start ?? 0;
  const end = range?.end ?? stats.size - 1;
  const stream = fileHandle.createReadStream({ start, end, autoClose: true });
  const iterator = stream[Symbol.asyncIterator]();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(next.value);
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      stream.destroy(reason instanceof Error ? reason : undefined);
    },
  });

  return new Response(body, {
    status: range ? 206 : 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(end - start + 1),
      "Content-Disposition": "inline",
      "Accept-Ranges": "bytes",
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${stats.size}` } : {}),
      "Cache-Control": "private, no-store, max-age=0",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
