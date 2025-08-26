import { describe, it, expect } from "vitest";
import { computeCERWER } from "../utils/metrics";

describe("computeCERWER", () => {
  it("returns zero for identical strings", () => {
    const r = computeCERWER("hello world", "hello world");
    expect(r.cer).toBe(0);
    expect(r.wer).toBe(0);
  });

  it("computes non-zero for differences", () => {
    const r = computeCERWER("hello world", "hello wrld");
    expect(r.cer).toBeGreaterThan(0);
    expect(r.wer).toBeGreaterThan(0);
  });
});
