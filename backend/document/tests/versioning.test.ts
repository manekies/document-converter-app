import { describe, it, expect, vi, afterEach } from "vitest";
import { updateDocument } from "../update";
import { listVersions } from "../versions_list";
import { getVersion } from "../versions_get";
import { documentDB } from "../db";

vi.mock("../db", () => ({
  documentDB: {
    exec: vi.fn(),
    query: vi.fn(),
    queryRow: vi.fn(),
    tx: vi.fn((callback) => callback(documentDB)), // Mock tx to call the callback with the mock db
  },
}));

describe("Versioning API", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("updateDocument", () => {
    it("should create a new version when documentStructure is provided", async () => {
      (documentDB.queryRow as any)
        .mockResolvedValueOnce({ id: "doc1" }) // check existence
        .mockResolvedValueOnce({ max_version: 1 }) // get max version
        .mockResolvedValueOnce({ updated_at: new Date() }); // get updated_at

      const req = {
        id: "doc1",
        documentStructure: { elements: [], metadata: {} },
      };
      await updateDocument(req as any);

      expect(documentDB.exec).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO document_versions"),
        "doc1",
        2,
        expect.any(String)
      );
    });
  });

  describe("listVersions", () => {
    it("should list all versions for a document", async () => {
      const mockVersions = { rows: [{ id: "v1" }, { id: "v2" }] };
      (documentDB.query as any).mockResolvedValue(mockVersions);

      const result = await listVersions({ params: { documentId: "doc1" } } as any);
      expect(result.versions.length).toBe(2);
      expect(documentDB.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, version_number, created_at"),
        "doc1"
      );
    });
  });

  describe("getVersion", () => {
    it("should retrieve a specific version's structure", async () => {
      const mockVersion = { document_structure: { elements: [{ type: "paragraph" }] } };
      (documentDB.queryRow as any).mockResolvedValue(mockVersion);

      const result = await getVersion({ params: { documentId: "doc1", versionId: "v1" } } as any);
      expect(result.documentStructure.elements[0].type).toBe("paragraph");
      expect(documentDB.queryRow).toHaveBeenCalledWith(
        expect.stringContaining("SELECT document_structure"),
        "doc1",
        "v1"
      );
    });
  });
});
