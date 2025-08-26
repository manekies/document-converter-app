import { api } from "encore.dev/api";
import { documentDB } from "./db";
import { originalImages } from "./storage";
import type { UploadResponse } from "./types";

interface UploadRequest {
  filename: string;
  mimeType: string;
  fileSize: number;
}

// Initiates document upload and returns a signed upload URL.
export const upload = api<UploadRequest, UploadResponse>(
  { expose: true, method: "POST", path: "/document/upload" },
  async (req) => {
    // Create document record
    const document = await documentDB.queryRow<{ id: string }>`
      INSERT INTO documents (original_filename, file_size, mime_type)
      VALUES (${req.filename}, ${req.fileSize}, ${req.mimeType})
      RETURNING id
    `;

    if (!document) {
      throw new Error("Failed to create document record");
    }

    // Generate signed upload URL
    const { url } = await originalImages.signedUploadUrl(
      `${document.id}/${req.filename}`,
      { ttl: 3600 } // 1 hour
    );

    return {
      documentId: document.id,
      uploadUrl: url,
    };
  }
);
