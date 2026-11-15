import { mkdtemp, readFile, rmdir, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { courseMaterialFolderName } from "./course-material-storage";
import {
  isAllowedCourseMaterialFile,
  isCourseMaterialPathInside,
  maxCourseMaterialSize,
  parseCourseMaterialUpload,
} from "./course-material-upload";

describe("course material folder names", () => {
  it("keeps readable course and class names", () => {
    expect(courseMaterialFolderName("Course Name - 2026")).toBe("Course Name - 2026");
    expect(courseMaterialFolderName("  Class 1  ")).toBe("Class 1");
  });

  it("replaces path separators and Windows-invalid characters", () => {
    expect(courseMaterialFolderName("../Class: 1?")).toBe("..-Class- 1-");
  });

  it("handles empty names and reserved Windows device names", () => {
    expect(courseMaterialFolderName("...")).toBe("untitled");
    expect(courseMaterialFolderName("CON")).toBe("_CON");
  });

  it("limits folder names to 100 characters", () => {
    expect(courseMaterialFolderName("a".repeat(150))).toHaveLength(100);
  });
});

describe("course material upload validation", () => {
  it("checks file signatures instead of trusting extensions", () => {
    expect(isAllowedCourseMaterialFile(".pdf", Buffer.from("%PDF-1.7"))).toBe(true);
    expect(isAllowedCourseMaterialFile(".pdf", Buffer.from("<html>"))).toBe(false);
    expect(
      isAllowedCourseMaterialFile(
        ".png",
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe(true);
    expect(isAllowedCourseMaterialFile(".docx", Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
  });

  it("rejects paths outside the private material directory", () => {
    const root = path.resolve("storage", "course-materials");
    expect(isCourseMaterialPathInside(root, path.join(root, "course", "file.pdf"))).toBe(true);
    expect(isCourseMaterialPathInside(root, path.resolve(root, "..", "outside.pdf"))).toBe(false);
    expect(isCourseMaterialPathInside(root, root)).toBe(false);
  });

  it("streams a single multipart file to a temporary path", async () => {
    const formData = new FormData();
    formData.set("courseId", "course-id");
    formData.set("classId", "class-id");
    formData.set("title", "Course guide");
    formData.set("file", new File([Buffer.from("%PDF-1.7")], "guide.pdf"));
    const request = new Request("http://localhost/api/course-materials", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: formData,
    });
    const directory = await mkdtemp(path.join(os.tmpdir(), "course-material-test-"));
    const tempFilePath = path.join(directory, "upload.tmp");

    try {
      const upload = await parseCourseMaterialUpload(request, tempFilePath);
      expect(upload.fields.get("courseId")).toBe("course-id");
      expect(upload.fields.get("classId")).toBe("class-id");
      expect(upload.fileName).toBe("guide.pdf");
      expect(upload.fileSize).toBe(8);
      expect(await readFile(tempFilePath, "utf8")).toBe("%PDF-1.7");
    } finally {
      try {
        await unlink(tempFilePath);
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
      }
      await rmdir(directory);
    }
  });

  it("rejects oversized requests before parsing the multipart body", async () => {
    const request = new Request("http://localhost/api/course-materials", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=example",
        "content-length": String(maxCourseMaterialSize + 128 * 1024 + 1),
      },
      body: "",
    });

    await expect(parseCourseMaterialUpload(request, "unused.tmp")).rejects.toMatchObject({
      status: 413,
    });
  });
});
