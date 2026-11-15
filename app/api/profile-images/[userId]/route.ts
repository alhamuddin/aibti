import { randomUUID } from "node:crypto";
import { lstat, open, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getProfileImageDirectory,
  isProfileImagePath,
  profileImageFilePath,
  profileImagePath,
} from "@/lib/profile-image-storage";
import { ProfileImageUploadError, parseProfileImageUpload } from "@/lib/profile-image-upload";

type RouteContext = { params: Promise<{ userId: string }> };

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

function detectImageType(
  header: Buffer,
): { extension: ".jpg" | ".png"; contentType: string } | null {
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return { extension: ".jpg", contentType: "image/jpeg" };
  }
  if (
    header.length >= 8 &&
    header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { extension: ".png", contentType: "image/png" };
  }
  return null;
}

async function removeManagedImage(userId: string, image: string | null) {
  if (!image || !isProfileImagePath(image, userId)) return;
  const imageKey = image.slice(image.lastIndexOf("/") + 1);
  const directory = await getProfileImageDirectory(userId, false);
  if (!directory) return;
  for (const extension of [".jpg", ".png"]) {
    const filePath = profileImageFilePath(directory.realDirectory, imageKey, extension);
    try {
      const stats = await lstat(filePath);
      if (stats.isFile() && !stats.isSymbolicLink()) await unlink(filePath);
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
    }
  }
}

async function getOwnUser(userId: string) {
  const session = await getSession();
  if (!session || session.user.id !== userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true, banned: true, mustChangePassword: true },
  });
  if (!user || user.banned || user.mustChangePassword) return null;
  return user;
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const { userId } = await params;
  const user = await getOwnUser(userId);
  if (!user)
    return NextResponse.json({ message: "Sign in to update your profile photo." }, { status: 401 });

  const directory = await getProfileImageDirectory(userId, true);
  if (!directory) {
    return NextResponse.json(
      { message: "The profile photo folder is unavailable." },
      { status: 500 },
    );
  }

  const tempFilePath = path.join(directory.realDirectory, `.upload-${randomUUID()}.tmp`);
  let storedFilePath: string | null = null;
  try {
    const upload = await parseProfileImageUpload(request, tempFilePath);
    if (upload.fileSize < 1) {
      return NextResponse.json({ message: "Choose an image to upload." }, { status: 400 });
    }

    const fileHandle = await open(tempFilePath, "r");
    let header: Buffer;
    try {
      header = Buffer.alloc(8);
      const { bytesRead } = await fileHandle.read(header, 0, header.length, 0);
      header = header.subarray(0, bytesRead);
    } finally {
      await fileHandle.close();
    }
    const imageType = detectImageType(header);
    if (!imageType) {
      return NextResponse.json({ message: "Choose a valid JPG or PNG image." }, { status: 400 });
    }

    const oldImage = user.image;
    const imageKey = randomUUID();
    const imageFilePath = profileImageFilePath(
      directory.realDirectory,
      imageKey,
      imageType.extension,
    );
    await rename(tempFilePath, imageFilePath);
    storedFilePath = imageFilePath;

    const image = profileImagePath(userId, imageKey);
    await prisma.user.update({ where: { id: userId }, data: { image } });
    storedFilePath = null;

    try {
      await removeManagedImage(userId, oldImage);
    } catch {
      // The new image is already saved; orphan cleanup can happen independently.
    }

    return NextResponse.json(
      { image },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof ProfileImageUploadError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  } finally {
    if (storedFilePath) {
      try {
        await unlink(storedFilePath);
      } catch (error) {
        if (!isMissingFileError(error)) throw error;
      }
    }
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
  const { userId } = await params;
  const user = await getOwnUser(userId);
  if (!user)
    return NextResponse.json({ message: "Sign in to update your profile photo." }, { status: 401 });

  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  try {
    await removeManagedImage(userId, user.image);
  } catch {
    // Keep profile photo deletion successful if best-effort file cleanup fails.
  }
  return NextResponse.json({ image: null }, { headers: { "Cache-Control": "private, no-store" } });
}
