import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import { originalImages, processedDocuments } from "./storage";
import { processImageToStructure } from "./processors";
import type { ProcessingResult, DocumentStructure, DocumentElement } from "./types";
import type { OrchestratorOptions } from "./orchestrator/router";

// Optional sharp for image preprocessing/extraction
let sharp: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sharp = require("sharp");
} catch {
  sharp = null;
}

interface ProcessRequest {
  documentId: string;
  // Processing orchestration options
  mode?: "auto" | "local" | "cloud";
  quality?: "fast" | "best";
  // Optional preferred OCR languages (Tesseract codes like "eng", "rus", "deu"), multi-language supported via "+"
  languages?: string[];
}

// Processes an uploaded document image to extract text and structure.
export const process = api<ProcessRequest, ProcessingResult>(
  { expose: true, method: "POST", path: "/document/:documentId/process" },
  async (req) => {
    if (!req.documentId) {
      throw APIError.invalidArgument("missing documentId");
    }

    // Update status to processing
    await documentDB.exec`
      UPDATE documents 
      SET processing_status = 'processing', updated_at = NOW()
      WHERE id = ${req.documentId}
    `;

    const started = Date.now();
    try {
      // Get document info
      const document = await documentDB.queryRow<{
        id: string;
        original_filename: string;
        mime_type: string;
      }>`
        SELECT id, original_filename, mime_type
        FROM documents
        WHERE id = ${req.documentId}
      `;

      if (!document) {
        throw APIError.notFound("document not found");
      }

      // Download the image
      const imagePath = `${document.id}/${document.original_filename}`;
      let imageBuffer = await originalImages.download(imagePath);

      // Preprocess image (denoise, normalize, increase contrast) to improve OCR
      if (sharp) {
        try {
          imageBuffer = await sharp(imageBuffer)
            .toColorspace("b-w")
            .linear(1.2, -10) // increase contrast slightly
            .sharpen()
            .normalize()
            .toBuffer();
        } catch {
          // ignore preprocessing failure
        }
      }

      const options: OrchestratorOptions = {
        mode: req.mode ?? "auto",
        quality: req.quality ?? "best",
        languages: req.languages,
      };

      // Process the image using orchestrator (local/cloud with fallbacks)
      const { text, structure, language, confidence, ocrProvider, llmProvider } = await processImageToStructure(
        imageBuffer,
        document.mime_type,
        options
      );

      // Optional: generate a preview asset and embed image element for structure preservation
      let enrichedStructure: DocumentStructure = structure;
      try {
        if (sharp) {
          const preview = await sharp(imageBuffer).jpeg({ quality: 80 }).toBuffer();
          const assetPath = `assets/${req.documentId}/page1.jpg`;
          await processedDocuments.upload(assetPath, preview, { contentType: "image/jpeg" });

          const imgElement: DocumentElement = {
            type: "image",
            content: "Page image",
            imageSrc: assetPath,
            imageWidth: enrichedStructure.metadata.dimensions.width,
            imageHeight: enrichedStructure.metadata.dimensions.height,
            position: { x: 0, y: 0, width: enrichedStructure.metadata.dimensions.width, height: enrichedStructure.metadata.dimensions.height },
            style: {},
          };

          // Place the image at the beginning to be available for export in flow mode if desired
          enrichedStructure = { ...enrichedStructure, elements: [imgElement, ...enrichedStructure.elements] };
        }
      } catch {
        // ignore embedding failures
      }

      // Update document with results
      await documentDB.exec`
        UPDATE documents 
        SET 
          processing_status = 'completed',
          extracted_text = ${text},
          detected_language = ${language},
          document_structure = ${JSON.stringify(enrichedStructure)},
          updated_at = NOW()
        WHERE id = ${req.documentId}
      `;

      const duration = Date.now() - started;
      await documentDB.exec`
        INSERT INTO processing_runs (document_id, mode, ocr_provider, llm_provider, confidence, text_length, duration_ms, status)
        VALUES (${req.documentId}, ${options.mode!}, ${ocrProvider}, ${llmProvider ?? null}, ${confidence}, ${text.length}, ${duration}, 'completed')
      `;

      return {
        documentId: req.documentId,
        status: "completed",
        extractedText: text,
        detectedLanguage: language,
        documentStructure: enrichedStructure,
      };
    } catch (error) {
      const duration = Date.now() - started;
      await documentDB.exec`
        INSERT INTO processing_runs (document_id, mode, ocr_provider, llm_provider, confidence, text_length, duration_ms, status)
        VALUES (${req.documentId}, ${req.mode ?? "auto"}, ${"unknown"}, ${null}, ${null}, ${0}, ${duration}, 'failed')
      `;
      // Update status to failed
      await documentDB.exec`
        UPDATE documents 
        SET processing_status = 'failed', updated_at = NOW()
        WHERE id = ${req.documentId}
      `;

      return {
        documentId: req.documentId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
