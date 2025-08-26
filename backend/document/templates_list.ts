import { api } from "encore.dev/api";
import { documentDB } from "./db";
import type { DocumentMatchingTemplate } from "./types";

interface ListTemplatesResponse {
  templates: Array<Omit<DocumentMatchingTemplate, "rois">>;
}

// Lists all document matching templates.
export const listTemplates = api<void, ListTemplatesResponse>(
  { expose: true, method: "GET", path: "/document-templates" },
  async () => {
    const result = await documentDB.query<Omit<DocumentMatchingTemplate, "rois">>`
      SELECT id, name, description, match_fingerprint, created_at, updated_at
      FROM document_templates
      ORDER BY created_at DESC
    `;
    return { templates: result.rows };
  }
);
