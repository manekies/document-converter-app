import { api } from "encore.dev/api";
import { documentDB } from "./db";

interface DeleteTemplateParams {
  templateId: string;
}

interface DeleteResponse {
  status: "ok";
}

// Deletes a document matching template by ID.
export const deleteTemplate = api<DeleteTemplateParams, DeleteResponse>(
  { expose: true, method: "DELETE", path: "/document-templates/:templateId" },
  async ({ templateId }) => {
    await documentDB.exec`
      DELETE FROM document_templates
      WHERE id = ${templateId}
    `;

    return { status: "ok" };
  }
);
