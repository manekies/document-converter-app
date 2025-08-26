import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTemplate } from "../templates_create";
import { listTemplates } from "../templates_list";
import { getTemplate } from "../templates_get";
import { updateTemplate } from "../templates_update";
import { deleteTemplate } from "../templates_delete";
import { documentDB } from "../db";

vi.mock("../db", () => ({
  documentDB: {
    exec: vi.fn(),
    query: vi.fn(),
    queryRow: vi.fn(),
    tx: vi.fn(),
  },
}));

describe("Template Management API", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createTemplate", () => {
    it("should create a new template and its ROIs", async () => {
      const req = {
        name: "Test Invoice",
        description: "A template for invoices.",
        matchFingerprint: "fingerprint123",
        rois: [{ name: "total", x: 1, y: 2, width: 3, height: 4 }],
      };
      (documentDB.tx as any).mockImplementation(async (callback: any) => {
        const db = {
          queryRow: vi.fn()
            .mockResolvedValueOnce({ id: "template-123", name: req.name, description: req.description })
            .mockResolvedValueOnce({ id: "roi-456", name: "total" }),
        };
        return callback(db);
      });

      await createTemplate(req as any);
      expect(documentDB.tx).toHaveBeenCalledTimes(1);
    });
  });

  describe("listTemplates", () => {
    it("should return a list of templates", async () => {
      const mockTemplates = { rows: [{ id: "1", name: "T1" }, { id: "2", name: "T2" }] };
      (documentDB.query as any).mockResolvedValue(mockTemplates);

      const result = await listTemplates();
      expect(result.templates.length).toBe(2);
      expect(documentDB.query).toHaveBeenCalledWith(expect.stringContaining("SELECT id, name"), undefined);
    });
  });

  describe("getTemplate", () => {
    it("should return a single template with its ROIs", async () => {
      const mockTemplate = { id: "1", name: "T1" };
      const mockRois = { rows: [{ id: "roi1", name: "field1" }] };
      (documentDB.queryRow as any).mockResolvedValue(mockTemplate);
      (documentDB.query as any).mockResolvedValue(mockRois);

      const result = await getTemplate({ params: { templateId: "1" } } as any);
      expect(result.name).toBe("T1");
      expect(result.rois.length).toBe(1);
      expect(result.rois[0].name).toBe("field1");
    });

    it("should throw notFound error if template does not exist", async () => {
      (documentDB.queryRow as any).mockResolvedValue(null);
      await expect(getTemplate({ params: { templateId: "bad-id" } } as any)).rejects.toThrow("template not found");
    });
  });

  describe("updateTemplate", () => {
    it("should update a template and its ROIs", async () => {
      const req = {
        params: { templateId: "1" },
        body: {
          name: "Updated Name",
          matchFingerprint: "fingerprint456",
          rois: [{ name: "new_field", x: 1, y: 2, width: 3, height: 4 }],
        },
      };
      (documentDB.tx as any).mockImplementation(async (callback: any) => {
        const db = {
          queryRow: vi.fn()
            .mockResolvedValueOnce({ id: "1", name: "Updated Name" })
            .mockResolvedValueOnce({ id: "roi-new" }),
          exec: vi.fn().mockResolvedValue(undefined),
        };
        return callback(db);
      });

      await updateTemplate(req as any);
      expect(documentDB.tx).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteTemplate", () => {
    it("should delete a template", async () => {
      (documentDB.exec as any).mockResolvedValue({ rowCount: 1 });
      const result = await deleteTemplate({ params: { templateId: "1" } } as any);
      expect(result.status).toBe("ok");
      expect(documentDB.exec).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM document_templates"), "1");
    });
  });
});
