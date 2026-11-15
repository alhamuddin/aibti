import { createHash } from "node:crypto";
import { lstat, mkdir, realpath } from "node:fs/promises";
import path from "node:path";

export function isProfileImageKey(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isProfileImagePath(value: string | null, userId: string) {
  if (!value) return false;
  const prefix = `/api/profile-images/${userId}/`;
  if (!value.startsWith(prefix)) return false;
  const key = value.slice(prefix.length);
  return isProfileImageKey(key);
}

export function profileImagePath(userId: string, imageKey: string) {
  return `/api/profile-images/${userId}/${imageKey}`;
}

export function profileImageFilePath(directory: string, imageKey: string, extension: string) {
  return path.join(directory, `${imageKey}${extension}`);
}

export function isPathInside(root: string, candidate: string): boolean {
  const relativePath = path.relative(root, candidate);
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

export async function getProfileImageDirectory(userId: string, create: boolean) {
  const storageRoot = path.resolve(process.cwd(), "storage", "profile-images");
  if (create) await mkdir(storageRoot, { recursive: true, mode: 0o700 });

  let realStorageRoot: string;
  try {
    realStorageRoot = await realpath(storageRoot);
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }

  const directory = path.resolve(
    realStorageRoot,
    createHash("sha256").update(userId).digest("hex"),
  );
  if (!isPathInside(realStorageRoot, directory)) return null;
  if (create) await mkdir(directory, { recursive: true, mode: 0o700 });

  try {
    const stats = await lstat(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) return null;
    const realDirectory = await realpath(directory);
    if (realDirectory !== directory || !isPathInside(realStorageRoot, realDirectory)) return null;
    return { realStorageRoot, realDirectory };
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
}
