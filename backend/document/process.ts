import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import { originalImages } from "./storage";
import { processImageToStructure } from "./processors";
import type { ProcessingResult } from "./types";
import type { OrchestratorOptions } from "./orchestrator/router";

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
      const imageBuffer = await originalImages.download(
        `${document.id}/${document.original_filename}`
      );

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

      // Update document with results
      await documentDB.exec`
        UPDATE documents 
        SET 
          processing_status = 'completed',
          extracted_text = ${text},
          detected_language = ${language},
          document_structure = ${JSON.stringify(structure)},
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
        documentStructure: structure,
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
