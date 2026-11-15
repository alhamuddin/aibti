import path from "node:path";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { IncomingHttpHeaders } from "node:http";
import busboy from "busboy";

export const maxCourseMaterialSize = 20 * 1024 * 1024;
const maxRequestSize = maxCourseMaterialSize + 128 * 1024;
const maxFieldSize = 4096;

export const courseMaterialExtensions = new Set([
  ".csv",
  ".doc",
  ".docx",
  ".jpeg",
  ".jpg",
  ".mp4",
  ".mov",
  ".pdf",
  ".png",
  ".ppt",
  ".pptx",
  ".txt",
  ".webm",
  ".xls",
  ".xlsx",
]);

export class CourseMaterialUploadError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413,
  ) {
    super(message);
    this.name = "CourseMaterialUploadError";
  }
}

export function isCourseMaterialPathInside(root: string, candidate: string): boolean {
  const relativePath = path.relative(root, candidate);
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

export type ParsedCourseMaterialUpload = {
  fields: Map<string, string>;
  fileName: string;
  fileSize: number;
};

export function isAllowedCourseMaterialFile(extension: string, header: Buffer): boolean {
  const startsWith = (...bytes: number[]) =>
    header.length >= bytes.length && bytes.every((byte, index) => header[index] === byte);

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return startsWith(0xff, 0xd8, 0xff);
    case ".png":
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case ".pdf":
      return header.subarray(0, 5).toString("ascii") === "%PDF-";
    case ".doc":
    case ".xls":
    case ".ppt":
      return startsWith(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
    case ".docx":
    case ".xlsx":
    case ".pptx":
      return startsWith(0x50, 0x4b, 0x03, 0x04);
    case ".mp4":
    case ".mov":
      return header.length >= 8 && header.toString("ascii", 4, 8) === "ftyp";
    case ".webm":
      return startsWith(0x1a, 0x45, 0xdf, 0xa3);
    case ".csv":
    case ".txt":
      return !header.includes(0);
    default:
      return false;
  }
}

export async function parseCourseMaterialUpload(
  request: Request,
  tempFilePath: string,
): Promise<ParsedCourseMaterialUpload> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new CourseMaterialUploadError("Upload a file using multipart form data.", 400);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      throw new CourseMaterialUploadError("Invalid request size.", 400);
    }
    if (Number(contentLength) > maxRequestSize) {
      throw new CourseMaterialUploadError("Materials must be smaller than 20 MB.", 413);
    }
  }
  if (!request.body) {
    throw new CourseMaterialUploadError("The upload body is empty.", 400);
  }

  let parser: ReturnType<typeof busboy>;
  try {
    parser = busboy({
      headers: { "content-type": contentType } as IncomingHttpHeaders,
      limits: {
        fileSize: maxCourseMaterialSize + 1,
        files: 2,
        fields: 4,
        fieldNameSize: 100,
        fieldSize: maxFieldSize,
        parts: 5,
        headerPairs: 50,
      },
    });
  } catch {
    throw new CourseMaterialUploadError("The upload form is invalid.", 400);
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
  const fields = new Map<string, string>();
  const fileTasks: Promise<void>[] = [];
  let fileName = "";
  let fileSize = 0;
  let sawFile = false;
  let settled = false;
  let requestSize = 0;

  return new Promise<ParsedCourseMaterialUpload>((resolve, reject) => {
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      source.destroy();
      void reader.cancel(error).catch(() => {});
      parser.destroy();
      void Promise.resolve()
        .then(() => Promise.allSettled(fileTasks))
        .then(() => reject(error));
    };

    parser.on("field", (name, value, info) => {
      if (info.valueTruncated || !["courseId", "classId", "title"].includes(name)) {
        fail(new CourseMaterialUploadError("The upload form contains invalid fields.", 400));
        return;
      }
      if (fields.has(name)) {
        fail(new CourseMaterialUploadError("The upload form contains duplicate fields.", 400));
        return;
      }
      fields.set(name, value);
    });

    parser.on("file", (name, stream, info) => {
      if (name !== "file" || sawFile) {
        stream.resume();
        fail(new CourseMaterialUploadError("Upload exactly one file.", 400));
        return;
      }
      sawFile = true;
      fileName = info.filename ?? "";
      stream.on("data", (chunk: Buffer) => {
        fileSize += chunk.length;
      });
      stream.on("limit", () => {
        fail(new CourseMaterialUploadError("Materials must be smaller than 20 MB.", 413));
      });
      const task = pipeline(stream, createWriteStream(tempFilePath, { flags: "wx", mode: 0o600 }));
      fileTasks.push(task);
      task.catch(fail);
    });

    parser.on("filesLimit", () =>
      fail(new CourseMaterialUploadError("Upload exactly one file.", 400)),
    );
    parser.on("fieldsLimit", () =>
      fail(new CourseMaterialUploadError("The upload form contains too many fields.", 400)),
    );
    parser.on("partsLimit", () =>
      fail(new CourseMaterialUploadError("The upload form contains too many parts.", 400)),
    );
    parser.on("error", () =>
      fail(new CourseMaterialUploadError("The upload form could not be read.", 400)),
    );
    source.on("data", (chunk: Buffer) => {
      requestSize += chunk.length;
      if (requestSize > maxRequestSize) {
        fail(new CourseMaterialUploadError("Materials must be smaller than 20 MB.", 413));
      }
    });
    source.on("error", () =>
      fail(new CourseMaterialUploadError("The upload body could not be read.", 400)),
    );
    parser.on("close", () => {
      void Promise.all(fileTasks).then(() => {
        if (settled) return;
        if (!sawFile) {
          fail(new CourseMaterialUploadError("Choose a file to upload.", 400));
          return;
        }
        settled = true;
        resolve({ fields, fileName, fileSize });
      }, fail);
    });

    source.pipe(parser);
  });
}
