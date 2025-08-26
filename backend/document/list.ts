import { api, Query } from "encore.dev/api";
import { documentDB } from "./db";
import type { Document } from "./types";

interface ListDocumentsRequest {
  limit?: Query<number>;
  offset?: Query<number>;
}

interface ListDocumentsResponse {
  documents: Document[];
  total: number;
}

// Lists all documents with pagination.
export const list = api<ListDocumentsRequest, ListDocumentsResponse>(
  { expose: true, method: "GET", path: "/documents" },
  async (req) => {
    const limit = req.limit || 20;
    const offset = req.offset || 0;

    // Get total count
    const countResult = await documentDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM documents
    `;
    const total = countResult?.count || 0;

    // Get documents
    const documents = await documentDB.queryAll<{
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
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      documents: documents.map(doc => ({
        id: doc.id,
        originalFilename: doc.original_filename,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        processingStatus: doc.processing_status as any,
        extractedText: doc.extracted_text || undefined,
        detectedLanguage: doc.detected_language || undefined,
        documentStructure: doc.document_structure 
          ? JSON.parse(doc.document_structure) 
          : undefined,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
      })),
      total,
    };
  }
);
