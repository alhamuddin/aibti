import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { IncomingHttpHeaders } from "node:http";
import busboy from "busboy";

export const maxProfileImageSize = 2 * 1024 * 1024;
const maxRequestSize = maxProfileImageSize + 128 * 1024;

export class ProfileImageUploadError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413,
  ) {
    super(message);
    this.name = "ProfileImageUploadError";
  }
}

export async function parseProfileImageUpload(request: Request, tempFilePath: string) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new ProfileImageUploadError("Choose a JPG or PNG image to upload.", 400);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      throw new ProfileImageUploadError("The upload size is invalid.", 400);
    }
    if (Number(contentLength) > maxRequestSize) {
      throw new ProfileImageUploadError("Profile photos must be 2 MB or smaller.", 413);
    }
  }
  if (!request.body) throw new ProfileImageUploadError("Choose an image to upload.", 400);

  let parser: ReturnType<typeof busboy>;
  try {
    parser = busboy({
      headers: { "content-type": contentType } as IncomingHttpHeaders,
      limits: { fileSize: maxProfileImageSize + 1, files: 1, fields: 0, parts: 1, headerPairs: 50 },
    });
  } catch {
    throw new ProfileImageUploadError("The upload form is invalid.", 400);
  }

  const reader = request.body.getReader();
  const source = Readable.from(
    (async function* () {
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) return;
          yield result.value;
        }
      } finally {
        reader.releaseLock();
      }
    })(),
  );
  let fileSize = 0;
  let sawFile = false;
  let requestSize = 0;
  let settled = false;
  let fileTask: Promise<void> | null = null;

  return new Promise<{ fileSize: number }>((resolve, reject) => {
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      source.destroy();
      void reader.cancel(error).catch(() => {});
      parser.destroy();
      void Promise.resolve(fileTask).then(
        () => reject(error),
        () => reject(error),
      );
    };

    parser.on("field", () => fail(new ProfileImageUploadError("Upload one image file only.", 400)));
    parser.on("file", (name, stream) => {
      if (name !== "photo" || sawFile) {
        stream.resume();
        fail(new ProfileImageUploadError("Upload one image file only.", 400));
        return;
      }
      sawFile = true;
      stream.on("data", (chunk: Buffer) => {
        fileSize += chunk.length;
      });
      stream.on("limit", () =>
        fail(new ProfileImageUploadError("Profile photos must be 2 MB or smaller.", 413)),
      );
      fileTask = pipeline(stream, createWriteStream(tempFilePath, { flags: "wx", mode: 0o600 }));
      fileTask.catch(fail);
    });
    parser.on("filesLimit", () =>
      fail(new ProfileImageUploadError("Upload one image file only.", 400)),
    );
    parser.on("partsLimit", () =>
      fail(new ProfileImageUploadError("Upload one image file only.", 400)),
    );
    parser.on("error", () =>
      fail(new ProfileImageUploadError("The upload form could not be read.", 400)),
    );
    source.on("data", (chunk: Buffer) => {
      requestSize += chunk.length;
      if (requestSize > maxRequestSize) {
        fail(new ProfileImageUploadError("Profile photos must be 2 MB or smaller.", 413));
      }
    });
    source.on("error", () =>
      fail(new ProfileImageUploadError("The upload could not be read.", 400)),
    );
    parser.on("close", () => {
      void Promise.resolve(fileTask).then(() => {
        if (settled) return;
        if (!sawFile || fileSize === 0) {
          fail(new ProfileImageUploadError("Choose an image to upload.", 400));
          return;
        }
        settled = true;
        resolve({ fileSize });
      }, fail);
    });
    source.pipe(parser);
  });
}
