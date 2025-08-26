import { api } from "encore.dev/api";
import { documentDB } from "./db";

interface DeleteResponse {
  status: "ok";
}

// Deletes a document matching template by ID.
export const deleteTemplate = api.delete<DeleteResponse>("/templates/:templateId", async ({ params }) => {
  const templateId = params.templateId;

  await documentDB.exec`
    DELETE FROM document_templates
    WHERE id = ${templateId}
  `;

  return { status: "ok" };
});
