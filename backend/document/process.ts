import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import { originalImages } from "./storage";
import { processImageToStructure } from "./processors";
import type { ProcessingResult, DocumentStructure } from "./types";

interface ProcessRequest {
  documentId: string;
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

      // Process the image using offline OCR (with optional cloud augmentation)
      const { text, structure, language } = await processImageToStructure(
        imageBuffer,
        document.mime_type
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

      return {
        documentId: req.documentId,
        status: "completed",
        extractedText: text,
        detectedLanguage: language,
        documentStructure: structure,
      };
    } catch (error) {
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
