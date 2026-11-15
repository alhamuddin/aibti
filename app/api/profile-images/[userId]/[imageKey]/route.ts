import { lstat, open, realpath } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getProfileImageDirectory,
  isPathInside,
  isProfileImageKey,
  isProfileImagePath,
  profileImageFilePath,
  profileImagePath,
} from "@/lib/profile-image-storage";

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; imageKey: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Sign in to view profile photos." }, { status: 401 });

  const { userId, imageKey } = await params;
  if (!isProfileImageKey(imageKey)) {
    return NextResponse.json({ message: "Profile photo not found." }, { status: 404 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true, banned: true },
  });
  if (
    !user ||
    user.banned ||
    !isProfileImagePath(user.image, userId) ||
    user.image !== profileImagePath(userId, imageKey)
  ) {
    return NextResponse.json({ message: "Profile photo not found." }, { status: 404 });
  }

  const directory = await getProfileImageDirectory(userId, false);
  if (!directory)
    return NextResponse.json({ message: "Profile photo not found." }, { status: 404 });

  let imagePath: string | null = null;
  let contentType: string | null = null;
  for (const candidate of [
    { extension: ".jpg", type: "image/jpeg" },
    { extension: ".png", type: "image/png" },
  ]) {
    const filePath = profileImageFilePath(directory.realDirectory, imageKey, candidate.extension);
    try {
      const stats = await lstat(filePath);
      if (!stats.isFile() || stats.isSymbolicLink()) continue;
      const realFilePath = await realpath(filePath);
      if (!isPathInside(directory.realStorageRoot, realFilePath)) continue;
      imagePath = realFilePath;
      contentType = candidate.type;
      break;
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
    }
  }
  if (!imagePath || !contentType) {
    return NextResponse.json({ message: "Profile photo not found." }, { status: 404 });
  }

  const fileHandle = await open(/* turbopackIgnore: true */ imagePath, "r");
  let stats: Awaited<ReturnType<typeof fileHandle.stat>>;
  try {
    stats = await fileHandle.stat();
  } catch (error) {
    await fileHandle.close();
    throw error;
  }
  if (!stats.isFile()) {
    await fileHandle.close();
    return NextResponse.json({ message: "Profile photo not found." }, { status: 404 });
  }

  const stream = fileHandle.createReadStream({ autoClose: true });
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
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stats.size),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store, max-age=0",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
