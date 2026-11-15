import { randomUUID } from "node:crypto";
import { open, mkdir, realpath, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canManageUsers, isUserRole } from "@/lib/roles";
import { roles } from "@/lib/permissions";
import { courseMaterialFolderName } from "@/lib/course-material-storage";
import {
  CourseMaterialUploadError,
  courseMaterialExtensions,
  isAllowedCourseMaterialFile,
  isCourseMaterialPathInside,
  maxCourseMaterialSize,
  parseCourseMaterialUpload,
} from "@/lib/course-material-upload";

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function safeOriginalFilename(filename: string): string {
  return (
    filename
      .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
      .trim()
      .slice(0, 250) || "course-material"
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }
  if (parsedOrigin.origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  const role = session?.user.role ?? "";
  if (!session || !isUserRole(role) || !roles[role].authorize({ material: ["write"] }).success) {
    return NextResponse.json({ message: "You cannot add course materials." }, { status: 403 });
  }
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, mustChangePassword: true },
  });
  if (!actor || actor.banned) {
    return NextResponse.json({ message: "This account cannot access courses." }, { status: 401 });
  }
  if (actor.mustChangePassword) {
    return NextResponse.json({ message: "Change your password to continue." }, { status: 403 });
  }

  const storageRoot = path.resolve(process.cwd(), "storage", "course-materials");
  await mkdir(storageRoot, { recursive: true, mode: 0o700 });
  const realStorageRoot = await realpath(storageRoot);
  const tempFilePath = path.join(realStorageRoot, `.upload-${randomUUID()}.tmp`);
  let storedFilePath: string | null = null;

  try {
    const upload = await parseCourseMaterialUpload(request, tempFilePath);
    const courseId = upload.fields.get("courseId");
    const classId = upload.fields.get("classId");
    const title = upload.fields.get("title")?.trim();
    const extension = path.extname(upload.fileName).toLowerCase();

    if (
      !courseId ||
      courseId.length > 180 ||
      !classId ||
      classId.length > 180 ||
      !title ||
      title.length > 250 ||
      !upload.fileName
    ) {
      return NextResponse.json(
        { message: "Provide a course, class, title, and file." },
        { status: 400 },
      );
    }
    if (upload.fileSize < 1 || upload.fileSize > maxCourseMaterialSize) {
      return NextResponse.json(
        { message: "Materials must be smaller than 20 MB." },
        { status: 413 },
      );
    }
    if (!courseMaterialExtensions.has(extension)) {
      return NextResponse.json({ message: "This file type is not allowed." }, { status: 400 });
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
    if (!isAllowedCourseMaterialFile(extension, fileHeader)) {
      return NextResponse.json(
        { message: "The file contents do not match the selected file type." },
        { status: 400 },
      );
    }

    const target = await prisma.courseClass.findFirst({
      where: { id: classId, courseId, course: { isMock: false } },
      select: {
        id: true,
        subject: { select: { title: true, teacherId: true } },
        course: { select: { title: true } },
      },
    });
    if (!target) {
      return NextResponse.json(
        { message: "The selected course class was not found." },
        { status: 404 },
      );
    }
    if (!canManageUsers(role) && target.subject.teacherId !== session.user.id) {
      return NextResponse.json(
        { message: "Teachers can add materials only to their assigned classes." },
        { status: 403 },
      );
    }

    const materialId = randomUUID();
    const storageKey = path.posix.join(
      courseMaterialFolderName(target.course.title),
      courseMaterialFolderName(target.subject.title),
      `${materialId}${extension}`,
    );
    const absolutePath = path.resolve(realStorageRoot, storageKey);
    if (!isCourseMaterialPathInside(realStorageRoot, absolutePath)) {
      return NextResponse.json({ message: "Invalid material storage path." }, { status: 400 });
    }

    const courseDirectory = path.join(
      realStorageRoot,
      courseMaterialFolderName(target.course.title),
    );
    await mkdir(courseDirectory, { recursive: true, mode: 0o700 });
    const realCourseDirectory = await realpath(courseDirectory);
    if (!isCourseMaterialPathInside(realStorageRoot, realCourseDirectory)) {
      return NextResponse.json({ message: "Invalid material storage path." }, { status: 400 });
    }
    const subjectDirectory = path.join(
      realCourseDirectory,
      courseMaterialFolderName(target.subject.title),
    );
    await mkdir(subjectDirectory, { recursive: true, mode: 0o700 });
    const realParentPath = await realpath(subjectDirectory);
    if (!isCourseMaterialPathInside(realStorageRoot, realParentPath)) {
      return NextResponse.json({ message: "Invalid material storage path." }, { status: 400 });
    }

    const finalPath = path.join(realParentPath, path.basename(absolutePath));
    await rename(tempFilePath, finalPath);
    storedFilePath = finalPath;

    try {
      const position = await prisma.courseMaterial.count({ where: { classId } });
      const material = await prisma.courseMaterial.create({
        data: {
          id: materialId,
          classId,
          title,
          type: "FILE",
          description: safeOriginalFilename(upload.fileName),
          url: `/api/course-materials/${materialId}`,
          storageKey,
          position: position + 1,
        },
        select: { id: true, title: true, type: true, url: true },
      });
      storedFilePath = null;
      return NextResponse.json(material, { status: 201 });
    } catch (error) {
      await unlink(finalPath);
      storedFilePath = null;
      throw error;
    }
  } catch (error) {
    if (error instanceof CourseMaterialUploadError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  } finally {
    if (storedFilePath) {
      await unlink(storedFilePath);
    }
    try {
      await unlink(tempFilePath);
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
    }
  }
}
