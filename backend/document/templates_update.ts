import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { DocumentMatchingTemplate, TemplateROI } from "./types";

interface UpdateTemplateRequest {
  name: string;
  description?: string;
  matchFingerprint: string;
  rois: Array<Omit<TemplateROI, "id">>;
}

// Updates a document matching template.
export const updateTemplate = api.put<DocumentMatchingTemplate>("/templates/:templateId", async ({ params, body }) => {
  const templateId = params.templateId;

  if (!body.name) {
    throw APIError.invalidArgument("template name is required");
  }
  if (!body.matchFingerprint) {
    throw APIError.invalidArgument("template matchFingerprint is required");
  }
  if (!body.rois || body.rois.length === 0) {
    throw APIError.invalidArgument("template must have at least one ROI");
  }

  const template = await documentDB.tx(async (db) => {
    // Update the parent template record
    const templateResult = await db.queryRow<any>`
      UPDATE document_templates
      SET name = ${body.name}, description = ${body.description ?? null}, match_fingerprint = ${body.matchFingerprint}, updated_at = NOW()
      WHERE id = ${templateId}
      RETURNING id, name, description, created_at, updated_at
    `;

    if (!templateResult) {
      throw APIError.notFound("template not found");
    }

    // Delete existing ROIs
    await db.exec`
      DELETE FROM template_rois
      WHERE template_id = ${templateId}
    `;

    // Insert the new ROIs
    const rois: TemplateROI[] = [];
    for (const roi of body.rois) {
      const roiResult = await db.queryRow<any>`
        INSERT INTO template_rois (template_id, name, x, y, width, height)
        VALUES (${templateId}, ${roi.name}, ${roi.x}, ${roi.y}, ${roi.width}, ${roi.height})
        RETURNING id, name, x, y, width, height
      `;
      rois.push(roiResult);
    }

    return {
      ...templateResult,
      rois,
    };
  });

  return template;
});
