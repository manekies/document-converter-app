import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { DocumentMatchingTemplate, TemplateROI } from "./types";

interface GetTemplateParams {
  templateId: string;
}

// Gets a single document matching template by ID.
export const getTemplate = api<GetTemplateParams, DocumentMatchingTemplate>(
  { expose: true, method: "GET", path: "/document-templates/:templateId" },
  async ({ templateId }) => {
    const templateData = await documentDB.queryRow<Omit<DocumentMatchingTemplate, "rois">>`
      SELECT id, name, description, match_fingerprint, created_at, updated_at
      FROM document_templates
      WHERE id = ${templateId}
    `;

    if (!templateData) {
      throw APIError.notFound("template not found");
    }

    const roisResult = await documentDB.query<TemplateROI>`
      SELECT id, name, x, y, width, height
      FROM template_rois
      WHERE template_id = ${templateId}
    `;

    return {
      ...templateData,
      rois: roisResult.rows,
    };
  }
);
