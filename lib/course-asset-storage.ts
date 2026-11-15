import { rm, realpath, lstat } from "node:fs/promises";
import path from "node:path";
import { isAllowedCourseMaterialFile, isCourseMaterialPathInside } from "./course-material-upload";

export type CourseAssetKind = "cover" | "promo";

const courseAssetExtensions: Record<CourseAssetKind, ReadonlySet<string>> = {
  cover: new Set([".jpg", ".jpeg", ".png"]),
  promo: new Set([".mp4", ".webm"]),
};

const courseAssetMimeTypes: Record<CourseAssetKind, Record<string, string>> = {
  cover: {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  },
  promo: {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  },
};

export function isCourseAssetKind(value: string): value is CourseAssetKind {
  return value === "cover" || value === "promo";
}

export function isValidCourseAssetId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,180}$/.test(value);
}

export function isAllowedCourseAssetFile(
  kind: CourseAssetKind,
  extension: string,
  header: Buffer,
): boolean {
  return (
    courseAssetExtensions[kind].has(extension) && isAllowedCourseMaterialFile(extension, header)
  );
}

export function getCourseAssetMimeType(kind: CourseAssetKind, extension: string): string | null {
  return courseAssetMimeTypes[kind][extension] ?? null;
}

export async function removeCourseAssets(courseId: string): Promise<void> {
  if (!isValidCourseAssetId(courseId)) {
    throw new Error("Course asset cleanup received an invalid course ID.");
  }
  const storageRoot = path.resolve(process.cwd(), "storage", "course-assets");
  let realStorageRoot: string;
  try {
    realStorageRoot = await realpath(storageRoot);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
  const courseDirectory = path.resolve(realStorageRoot, courseId);
  if (!isCourseMaterialPathInside(realStorageRoot, courseDirectory)) {
    throw new Error("Course asset cleanup found an invalid storage path.");
  }
  try {
    const stats = await lstat(courseDirectory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new Error("Course asset cleanup found an invalid storage directory.");
    }
    const realCourseDirectory = await realpath(courseDirectory);
    if (!isCourseMaterialPathInside(realStorageRoot, realCourseDirectory)) {
      throw new Error("Course asset cleanup found an invalid storage path.");
    }
    await rm(realCourseDirectory, { recursive: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}
