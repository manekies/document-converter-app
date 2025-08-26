import { api } from "encore.dev/api";
import { documentDB } from "./db";

// Define a type for the version info, without the large structure payload
interface VersionInfo {
  id: string;
  version_number: number;
  created_at: Date;
}

interface ListVersionsResponse {
  versions: VersionInfo[];
}

// Lists all available versions for a document.
export const listVersions = api.get<ListVersionsResponse>("/documents/:documentId/versions", async ({ params }) => {
  const documentId = params.documentId;
  const result = await documentDB.query<VersionInfo>`
    SELECT id, version_number, created_at
    FROM document_versions
    WHERE document_id = ${documentId}
    ORDER BY version_number DESC
  `;
  return { versions: result.rows };
});
