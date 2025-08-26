import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { UpdateDocumentRequest, UpdateDocumentResponse } from "./types";

// Updates the extracted text and/or structure for a document.
export const updateDocument = api<UpdateDocumentRequest, UpdateDocumentResponse>(
  { expose: true, method: "PUT", path: "/document/:id" },
  async (req) => {
    const { id, extractedText, documentStructure } = req;
    if (!id) {
      throw APIError.invalidArgument("missing id");
    }

    // Ensure document exists
    const existing = await documentDB.queryRow<{ id: string }>`
      SELECT id FROM documents WHERE id = ${id}
    `;
    if (!existing) {
      throw APIError.notFound("document not found");
    }

    await documentDB.exec`
      UPDATE documents SET
        extracted_text = ${extractedText ?? null},
        document_structure = ${documentStructure ? JSON.stringify(documentStructure) : null},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    const updated = await documentDB.queryRow<{ updated_at: Date }>`
      SELECT updated_at FROM documents WHERE id = ${id}
    `;
    return { id, updatedAt: updated!.updated_at };
  }
);
