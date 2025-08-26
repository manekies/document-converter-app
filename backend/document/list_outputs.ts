import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { ListOutputsRequest, ListOutputsResponse } from "./types";

// Lists exported outputs for a document.
export const listOutputs = api<ListOutputsRequest, ListOutputsResponse>(
  { expose: true, method: "GET", path: "/document/:documentId/outputs" },
  async (req) => {
    if (!req.documentId) {
      throw APIError.invalidArgument("missing documentId");
    }
    const rows = await documentDB.queryAll<{
      id: string;
      document_id: string;
      format: string;
      file_path: string;
      file_size: number;
      created_at: Date;
    }>`
      SELECT id, document_id, format, file_path, file_size, created_at
      FROM document_outputs
      WHERE document_id = ${req.documentId}
      ORDER BY created_at DESC
    `;
    const outputs = rows.map((r) => ({
      id: r.id,
      documentId: r.document_id,
      format: r.format as any,
      filePath: r.file_path,
      fileSize: r.file_size,
      createdAt: r.created_at,
    }));
    return { outputs };
  }
);
