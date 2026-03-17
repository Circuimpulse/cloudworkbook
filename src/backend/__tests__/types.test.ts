import { describe, it, expect } from "vitest";
import { getPrivateMetadata } from "../types";

describe("getPrivateMetadata", () => {
  it("extracts geminiApiKey from valid metadata", () => {
    const metadata = { geminiApiKey: "AIzaSy123" };
    const result = getPrivateMetadata(metadata);
    expect(result.geminiApiKey).toBe("AIzaSy123");
  });

  it("returns empty object for null", () => {
    const result = getPrivateMetadata(null);
    expect(result).toEqual({});
  });

  it("returns empty object for undefined", () => {
    const result = getPrivateMetadata(undefined);
    expect(result).toEqual({});
  });

  it("returns empty object for non-object", () => {
    const result = getPrivateMetadata("string");
    expect(result).toEqual({});
  });

  it("handles metadata without geminiApiKey", () => {
    const result = getPrivateMetadata({ otherKey: "value" });
    expect(result.geminiApiKey).toBeUndefined();
  });
});
