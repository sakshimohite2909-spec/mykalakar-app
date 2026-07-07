import { describe, expect, it, beforeEach, vi } from "vitest";
import { IMAGE_POOL } from "@/data/imagePool";
import { allocateImage, resetGlobalImageAllocator } from "@/utils/globalImageAllocator";

describe("globalImageAllocator", () => {
  beforeEach(() => {
    resetGlobalImageAllocator();
  });

  it("ships a globally unique 120+ image pool", () => {
    expect(IMAGE_POOL.length).toBeGreaterThanOrEqual(120);
    expect(new Set(IMAGE_POOL.map((image) => image.id)).size).toBe(IMAGE_POOL.length);
    expect(new Set(IMAGE_POOL.map((image) => image.url)).size).toBe(IMAGE_POOL.length);
  });

  it("allocates every pool image once and hard-fails after exhaustion", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const allocated = IMAGE_POOL.map((_, index) =>
      allocateImage({
        category: index % 2 === 0 ? "mandal" : "event",
        context: "test-card",
        entityId: `entity-${index}`,
      }),
    );

    expect(new Set(allocated.map((image) => image.id)).size).toBe(IMAGE_POOL.length);
    expect(new Set(allocated.map((image) => image.url)).size).toBe(IMAGE_POOL.length);
    expect(() =>
      allocateImage({
        category: "general",
        context: "test-card",
        entityId: "overflow",
      }),
    ).toThrow(/No unused image exists/);
    consoleError.mockRestore();
  });
});
