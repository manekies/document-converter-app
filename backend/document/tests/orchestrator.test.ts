import { describe, it, expect } from "vitest";
import { decideRoute } from "../orchestrator/router";

describe("decideRoute", () => {
  it("prefers local for small files in auto", () => {
    const r = decideRoute(500 * 1024, { mode: "auto" });
    expect(r.preferLocal).toBe(true);
    expect(r.allowCloud).toBe(true);
  });

  it("allows cloud for large files in auto", () => {
    const r = decideRoute(5 * 1024 * 1024, { mode: "auto" });
    expect(r.preferLocal).toBe(false);
    expect(r.allowCloud).toBe(true);
  });

  it("forces local", () => {
    const r = decideRoute(10 * 1024 * 1024, { mode: "local" });
    expect(r.preferLocal).toBe(true);
    expect(r.allowCloud).toBe(false);
  });

  it("forces cloud", () => {
    const r = decideRoute(100 * 1024, { mode: "cloud" });
    expect(r.preferLocal).toBe(false);
    expect(r.allowCloud).toBe(true);
  });
});
