import { api } from "encore.dev/api";
import { documentDB } from "./db";
import type { Document } from "./types";

interface GetDocumentRequest {
  id: string;
}

// Retrieves document information by ID.
export const get = api<GetDocumentRequest, Document>(
  { expose: true, method: "GET", path: "/document/:id" },
  async (req) => {
    const document = await documentDB.queryRow<{
      id: string;
      original_filename: string;
      file_size: number;
      mime_type: string;
      processing_status: string;
      extracted_text: string | null;
      detected_language: string | null;
      document_structure: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT 
        id, original_filename, file_size, mime_type, processing_status,
        extracted_text, detected_language, document_structure,
        created_at, updated_at
      FROM documents
      WHERE id = ${req.id}
    `;

    if (!document) {
      throw new Error("Document not found");
    }

    return {
      id: document.id,
      originalFilename: document.original_filename,
      fileSize: document.file_size,
      mimeType: document.mime_type,
      processingStatus: document.processing_status as any,
      extractedText: document.extracted_text || undefined,
      detectedLanguage: document.detected_language || undefined,
      documentStructure: document.document_structure 
        ? JSON.parse(document.document_structure) 
        : undefined,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
    };
  }
);
