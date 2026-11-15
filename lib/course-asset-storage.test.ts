import { describe, expect, it } from "vitest";
import {
  getCourseAssetMimeType,
  isAllowedCourseAssetFile,
  isCourseAssetKind,
  isValidCourseAssetId,
} from "./course-asset-storage";

describe("course asset validation", () => {
  it("allows only matching image and video signatures", () => {
    expect(
      isAllowedCourseAssetFile(
        "cover",
        ".png",
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe(true);
    expect(isAllowedCourseAssetFile("cover", ".mp4", Buffer.from("....ftyp"))).toBe(false);
    expect(isAllowedCourseAssetFile("promo", ".jpg", Buffer.from([0xff, 0xd8, 0xff]))).toBe(false);
    expect(isAllowedCourseAssetFile("promo", ".mp4", Buffer.from("....ftyp"))).toBe(true);
    expect(isAllowedCourseAssetFile("promo", ".webm", Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))).toBe(
      true,
    );
  });

  it("maps supported media extensions to safe content types", () => {
    expect(getCourseAssetMimeType("cover", ".jpeg")).toBe("image/jpeg");
    expect(getCourseAssetMimeType("promo", ".webm")).toBe("video/webm");
    expect(getCourseAssetMimeType("cover", ".svg")).toBeNull();
  });

  it("validates asset kinds and course IDs used in storage paths", () => {
    expect(isCourseAssetKind("cover")).toBe(true);
    expect(isCourseAssetKind("avatar")).toBe(false);
    expect(isValidCourseAssetId("course-id_123")).toBe(true);
    expect(isValidCourseAssetId("../outside")).toBe(false);
  });
});
