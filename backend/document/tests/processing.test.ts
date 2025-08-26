import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { process as processHandler } from "../process";
import { documentDB } from "../db";
import { originalImages, processedDocuments } from "../storage";
import { processImageToStructure } from "../processors";
import { findMatchingTemplate } from "../template_matcher";

// Mock dependencies
vi.mock("../db", () => ({
  documentDB: {
    exec: vi.fn(),
    queryRow: vi.fn(),
  },
}));

vi.mock("../storage", () => ({
  originalImages: {
    download: vi.fn(),
  },
  processedDocuments: {
    upload: vi.fn(),
  },
}));

vi.mock("../processors", () => ({
  processImageToStructure: vi.fn(),
}));

vi.mock("../template_matcher", () => ({
  findMatchingTemplate: vi.fn(),
}));

const mockSharpInstance = {
  deskew: vi.fn().mockReturnThis(),
  denoise: vi.fn().mockReturnThis(),
  threshold: vi.fn().mockReturnThis(),
  toColorspace: vi.fn().mockReturnThis(),
  linear: vi.fn().mockReturnThis(),
  sharpen: vi.fn().mockReturnThis(),
  normalize: vi.fn().mockReturnThis(),
  jpeg: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from("processed-image")),
};

// Mock sharp conditionally, as it's an optional dependency
try {
  vi.mock("sharp", () => ({
    __esModule: true,
    default: vi.fn(() => mockSharpInstance),
  }));
} catch (e) {
  // sharp not installed, which is fine in some environments
}


describe("Image Preprocessing Pipeline", () => {

  beforeEach(() => {
    // Mock default return values for dependencies
    (documentDB.queryRow as any).mockResolvedValue({
      id: "test-doc-id",
      original_filename: "test.png",
      mime_type: "image/png",
    });
    (originalImages.download as any).mockResolvedValue(Buffer.from("original-image-buffer"));
    (processImageToStructure as any).mockResolvedValue({
      text: "extracted text",
      structure: { metadata: { dimensions: { width: 100, height: 100 } }, elements: [] },
      language: "eng",
      confidence: 95,
      ocrProvider: "tesseract",
    });
    (documentDB.exec as any).mockResolvedValue({ rows: [], rowCount: 1 });
    (processedDocuments.upload as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not call any preprocessing methods if options are not provided", async () => {
    const req = { documentId: "test-doc-id" };
    await processHandler(req as any);

    expect(mockSharpInstance.deskew).not.toHaveBeenCalled();
    expect(mockSharpInstance.denoise).not.toHaveBeenCalled();
    expect(mockSharpInstance.threshold).not.toHaveBeenCalled();
  });

  it("should call deskew() when preprocessing.deskew is true", async () => {
    const req = {
      documentId: "test-doc-id",
      preprocessing: { deskew: true },
    };
    await processHandler(req as any);

    expect(mockSharpInstance.deskew).toHaveBeenCalledTimes(1);
    expect(mockSharpInstance.denoise).not.toHaveBeenCalled();
    expect(mockSharpInstance.threshold).not.toHaveBeenCalled();
  });

  it("should call denoise() when preprocessing.denoise is true", async () => {
    const req = {
      documentId: "test-doc-id",
      preprocessing: { denoise: true },
    };
    await processHandler(req as any);

    expect(mockSharpInstance.denoise).toHaveBeenCalledTimes(1);
    expect(mockSharpInstance.deskew).not.toHaveBeenCalled();
    expect(mockSharpInstance.threshold).not.toHaveBeenCalled();
  });

  it("should call threshold() for binarization when preprocessing.binarize is true", async () => {
    const req = {
      documentId: "test-doc-id",
      preprocessing: { binarize: true },
    };
    await processHandler(req as any);

    expect(mockSharpInstance.threshold).toHaveBeenCalledTimes(1);
    expect(mockSharpInstance.deskew).not.toHaveBeenCalled();
    expect(mockSharpInstance.denoise).not.toHaveBeenCalled();
  });

  it("should call all specified preprocessing methods", async () => {
    const req = {
      documentId: "test-doc-id",
      preprocessing: {
        deskew: true,
        denoise: true,
        binarize: true,
      },
    };
    await processHandler(req as any);

    expect(mockSharpInstance.deskew).toHaveBeenCalledTimes(1);
    expect(mockSharpInstance.denoise).toHaveBeenCalledTimes(1);
    expect(mockSharpInstance.threshold).toHaveBeenCalledTimes(1);
  });

  describe("with template matching", () => {
    it("should pass ROIs to the processor if a template is matched", async () => {
      const mockTemplate = {
        id: "template1",
        name: "Test Template",
        rois: [{ id: "roi1", name: "field1", x: 10, y: 20, width: 100, height: 30 }],
      };
      (findMatchingTemplate as any).mockResolvedValue(mockTemplate);

      const req = { documentId: "test-doc-id" };
      await processHandler(req as any);

      expect(findMatchingTemplate).toHaveBeenCalledTimes(1);

      const processOptions = (processImageToStructure as any).mock.calls[0][2];
      expect(processOptions).toBeDefined();
      expect(processOptions.rois).toBe(mockTemplate.rois);
    });

    it("should not pass ROIs if no template is matched", async () => {
      (findMatchingTemplate as any).mockResolvedValue(null);

      const req = { documentId: "test-doc-id" };
      await processHandler(req as any);

      expect(findMatchingTemplate).toHaveBeenCalledTimes(1);
      const processOptions = (processImageToStructure as any).mock.calls[0][2];
      expect(processOptions.rois).toBeUndefined();
    });
  });
});
