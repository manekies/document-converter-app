import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findMatchingTemplate } from "../template_matcher";
import { documentDB } from "../db";
import { phash } from "phash-im";

vi.mock("../db", () => ({
  documentDB: {
    query: vi.fn(),
    queryRow: vi.fn(),
  },
}));

vi.mock("phash-im", () => ({
  phash: vi.fn(),
}));

describe("findMatchingTemplate", () => {
  const mockTemplates = [
    { id: "template1", match_fingerprint: "10101010" },
    { id: "template2", match_fingerprint: "11111111" },
    { id: "template3", match_fingerprint: "00000000" },
  ];

  beforeEach(() => {
    (documentDB.query as any).mockResolvedValue({ rows: mockTemplates });
    (documentDB.queryRow as any).mockImplementation((query: string, id: string) => {
      if (id === "template1") return { id: "template1", name: "Template 1", rois: [] };
      return null;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return the best matching template if Hamming distance is below threshold", async () => {
    (phash as any).mockResolvedValue("10101011"); // Distance 1 from template1

    const result = await findMatchingTemplate(Buffer.from("test"));

    expect(phash).toHaveBeenCalledTimes(1);
    expect(documentDB.query).toHaveBeenCalledTimes(1);
    expect(documentDB.queryRow).toHaveBeenCalledTimes(2); // Fetches template and then ROIs
    expect(result).not.toBeNull();
    expect(result?.id).toBe("template1");
  });

  it("should return null if no template is within the Hamming distance threshold", async () => {
    (phash as any).mockResolvedValue("01010101"); // Distance > 5 from all templates

    const result = await findMatchingTemplate(Buffer.from("test"));
    expect(result).toBeNull();
  });

  it("should return null if an error occurs during processing", async () => {
    (phash as any).mockRejectedValue(new Error("pHash failed"));
    const result = await findMatchingTemplate(Buffer.from("test"));
    expect(result).toBeNull();
  });
});
