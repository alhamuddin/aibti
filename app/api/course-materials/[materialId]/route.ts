import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/roles";
import { roles } from "@/lib/permissions";
import { listCoursesForUser } from "@/lib/course-query";
import { isCourseMaterialPathInside } from "@/lib/course-material-upload";

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function encodeFilename(filename: string): string {
  return encodeURIComponent(filename).replace(/[!'()*]/g, (character) => {
    return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> },
) {
  const session = await getSession();
  const role = session?.user.role ?? "";
  if (!session || !isUserRole(role)) {
    return NextResponse.json({ message: "Sign in to download this material." }, { status: 401 });
  }
  if (!roles[role].authorize({ material: ["read"] }).success) {
    return NextResponse.json({ message: "You cannot access course materials." }, { status: 403 });
  }
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, mustChangePassword: true },
  });
  if (!actor || actor.banned) {
    return NextResponse.json(
      { message: "This account cannot access course materials." },
      { status: 401 },
    );
  }
  if (actor.mustChangePassword) {
    return NextResponse.json({ message: "Change your password to continue." }, { status: 403 });
  }

  const { materialId } = await params;
  const material = await prisma.courseMaterial.findUnique({
    where: { id: materialId },
    select: {
      title: true,
      description: true,
      type: true,
      storageKey: true,
      class: { select: { courseId: true } },
    },
  });
  if (!material || material.type !== "FILE" || !material.storageKey) {
    return NextResponse.json({ message: "Material not found." }, { status: 404 });
  }
  const access = await listCoursesForUser(session.user.id, role, 1, 1, "", material.class.courseId);
  const canAccessMaterial = access.courses.some((course) =>
    course.batches.some((batch) =>
      batch.subjects.some((subject) =>
        subject.classes.some((classSession) =>
          classSession.materials.some((courseMaterial) => courseMaterial.id === materialId),
        ),
      ),
    ),
  );
  if (!canAccessMaterial) {
    return NextResponse.json(
      { message: "You cannot access this course material." },
      { status: 403 },
    );
  }

  const storageRoot = path.resolve(process.cwd(), "storage", "course-materials");
  let realStorageRoot: string;
  let realFilePath: string;
  try {
    realStorageRoot = await realpath(storageRoot);
    const absolutePath = path.resolve(realStorageRoot, material.storageKey);
    if (!isCourseMaterialPathInside(realStorageRoot, absolutePath)) {
      return NextResponse.json({ message: "Material file path is invalid." }, { status: 500 });
    }
    const storedFileStats = await lstat(absolutePath);
    if (!storedFileStats.isFile()) {
      return NextResponse.json({ message: "Material not found." }, { status: 404 });
    }
    realFilePath = await realpath(absolutePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return NextResponse.json({ message: "Material not found." }, { status: 404 });
    }
    throw error;
  }
  if (!isCourseMaterialPathInside(realStorageRoot, realFilePath)) {
    return NextResponse.json({ message: "Material file path is invalid." }, { status: 500 });
  }

  const fileHandle = await open(realFilePath, "r");
  let fileStats: Awaited<ReturnType<typeof fileHandle.stat>>;
  try {
    fileStats = await fileHandle.stat();
  } catch (error) {
    await fileHandle.close();
    throw error;
  }
  if (!fileStats.isFile()) {
    await fileHandle.close();
    return NextResponse.json({ message: "Material not found." }, { status: 404 });
  }

  const storedFilename = material.description ?? material.title;
  const filename = storedFilename.replace(/[\r\n\u0000]/g, "_").trim() || "course-material";
  const fallbackFilename = filename.replace(/[^\x20-\x7e"\\]/g, "_");
  const stream = fileHandle.createReadStream({ autoClose: true });
  const iterator = stream[Symbol.asyncIterator]();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = await iterator.next();
        if (result.done) {
          controller.close();
        } else {
          controller.enqueue(result.value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      stream.destroy(reason instanceof Error ? reason : undefined);
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodeFilename(filename)}`,
      "Content-Length": String(fileStats.size),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
