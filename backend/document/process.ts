import { api } from "encore.dev/api";
import { documentDB } from "./db";
import { originalImages } from "./storage";
import type { ProcessingResult, DocumentStructure, DocumentElement } from "./types";

interface ProcessRequest {
  documentId: string;
}

// Processes an uploaded document image to extract text and structure.
export const process = api<ProcessRequest, ProcessingResult>(
  { expose: true, method: "POST", path: "/document/:documentId/process" },
  async (req) => {
    try {
      // Update status to processing
      await documentDB.exec`
        UPDATE documents 
        SET processing_status = 'processing', updated_at = NOW()
        WHERE id = ${req.documentId}
      `;

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
        throw new Error("Document not found");
      }

      // Download the image
      const imageBuffer = await originalImages.download(
        `${document.id}/${document.original_filename}`
      );

      // Process the image (mock implementation)
      const processingResult = await processImage(imageBuffer, document.mime_type);

      // Update document with results
      await documentDB.exec`
        UPDATE documents 
        SET 
          processing_status = 'completed',
          extracted_text = ${processingResult.extractedText},
          detected_language = ${processingResult.detectedLanguage},
          document_structure = ${JSON.stringify(processingResult.documentStructure)},
          updated_at = NOW()
        WHERE id = ${req.documentId}
      `;

      return {
        documentId: req.documentId,
        status: "completed",
        extractedText: processingResult.extractedText,
        detectedLanguage: processingResult.detectedLanguage,
        documentStructure: processingResult.documentStructure,
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

// Mock image processing function
async function processImage(imageBuffer: Buffer, mimeType: string) {
  // In a real implementation, this would use OCR libraries like Tesseract.js,
  // computer vision APIs, or AI services to:
  // 1. Clean and enhance the image
  // 2. Detect text regions and structure
  // 3. Extract text with formatting
  // 4. Identify document elements (headings, paragraphs, tables, etc.)

  // Mock extracted text
  const extractedText = `Sample Document

This is a sample document that has been processed from an image.

Key Features:
• Text extraction
• Structure detection
• Format preservation

The system can handle various document types including:
1. Handwritten notes
2. Printed documents
3. Screenshots
4. Scanned papers

For more information, please contact support.`;

  // Mock document structure
  const documentStructure: DocumentStructure = {
    elements: [
      {
        type: "heading",
        content: "Sample Document",
        position: { x: 50, y: 50, width: 500, height: 40 },
        style: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
        level: 1,
      },
      {
        type: "paragraph",
        content: "This is a sample document that has been processed from an image.",
        position: { x: 50, y: 120, width: 500, height: 60 },
        style: { fontSize: 12, textAlign: "left" },
      },
      {
        type: "heading",
        content: "Key Features:",
        position: { x: 50, y: 200, width: 500, height: 30 },
        style: { fontSize: 16, fontWeight: "bold" },
        level: 2,
      },
      {
        type: "list",
        content: "• Text extraction\n• Structure detection\n• Format preservation",
        position: { x: 70, y: 240, width: 480, height: 90 },
        style: { fontSize: 12 },
      },
    ],
    metadata: {
      pageCount: 1,
      orientation: "portrait",
      dimensions: { width: 600, height: 800 },
    },
  };

  return {
    extractedText,
    detectedLanguage: "en",
    documentStructure,
  };
}
