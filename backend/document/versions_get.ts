import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { DocumentStructure } from "./types";

interface GetVersionResponse {
  documentId: string;
  versionId: string;
  documentStructure: DocumentStructure;
}

// Gets the document structure for a specific version.
export const getVersion = api.get<GetVersionResponse>("/documents/:documentId/versions/:versionId", async ({ params }) => {
  const { documentId, versionId } = params;

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
});
