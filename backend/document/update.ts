import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { UpdateDocumentRequest, UpdateDocumentResponse } from "./types";

// Updates the extracted text and/or structure for a document, creating a new version.
export const updateDocument = api<UpdateDocumentRequest, UpdateDocumentResponse>(
  { expose: true, method: "PUT", path: "/document/:id" },
  async (req) => {
    const { id, extractedText, documentStructure } = req;
    if (!id) {
      throw APIError.invalidArgument("missing id");
    }

    const result = await documentDB.tx(async (db) => {
      // Ensure document exists
      const existing = await db.queryRow<{ id: string }>`
        SELECT id FROM documents WHERE id = ${id}
      `;
      if (!existing) {
        throw APIError.notFound("document not found");
      }

      // If the structure is being updated, create a new version.
      if (documentStructure) {
        // Get the latest version number to increment it
        const latestVersion = await db.queryRow<{ max_version: number }>`
          SELECT MAX(version_number) as max_version FROM document_versions WHERE document_id = ${id}
        `;
        const newVersionNumber = (latestVersion?.max_version ?? 0) + 1;

        // Insert new version
        await db.exec`
          INSERT INTO document_versions (document_id, version_number, document_structure)
          VALUES (${id}, ${newVersionNumber}, ${JSON.stringify(documentStructure)})
        `;
      }

      // Update the main documents table with the latest content
      await db.exec`
        UPDATE documents SET
          extracted_text = ${extractedText ?? null},
          document_structure = ${documentStructure ? JSON.stringify(documentStructure) : null},
          updated_at = NOW()
        WHERE id = ${id}
      `;

      const updated = await db.queryRow<{ updated_at: Date }>`
        SELECT updated_at FROM documents WHERE id = ${id}
      `;
      return { id, updatedAt: updated!.updated_at };
    });

    return result;
  }
);
