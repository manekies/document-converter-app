import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { DocumentStructure } from "./types";

interface GetVersionParams {
  documentId: string;
  versionId: string;
}

interface GetVersionResponse {
  documentId: string;
  versionId: string;
  documentStructure: DocumentStructure;
}

// Gets the document structure for a specific version.
export const getVersion = api<GetVersionParams, GetVersionResponse>(
  { expose: true, method: "GET", path: "/documents/:documentId/versions/:versionId" },
  async ({ documentId, versionId }) => {
    const result = await documentDB.queryRow<{ document_structure: DocumentStructure }>`
      SELECT document_structure
      FROM document_versions
      WHERE document_id = ${documentId} AND id = ${versionId}
    `;

    if (!result) {
      throw APIError.notFound("version not found");
    }

    return {
      documentId,
      versionId,
      documentStructure: result.document_structure,
    };
  }
);
