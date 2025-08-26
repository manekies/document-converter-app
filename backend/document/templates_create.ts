import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { DocumentMatchingTemplate, TemplateROI } from "./types";

interface CreateTemplateRequest {
  name: string;
  description?: string;
  matchFingerprint: string;
  rois: Array<Omit<TemplateROI, "id">>;
}

// Creates a new document matching template.
export const createTemplate = api<CreateTemplateRequest, DocumentMatchingTemplate>(
  { expose: true, method: "POST", path: "/document-templates" },
  async (req) => {
    if (!req.name) {
      throw APIError.invalidArgument("template name is required");
    }
    if (!req.matchFingerprint) {
      throw APIError.invalidArgument("template matchFingerprint is required");
    }
    if (!req.rois || req.rois.length === 0) {
      throw APIError.invalidArgument("template must have at least one ROI");
    }

    // Use a transaction to ensure template and ROIs are created atomically.
    const template = await documentDB.tx(async (db) => {
      // Insert the parent template record
      const templateResult = await db.queryRow<any>`
        INSERT INTO document_templates (name, description, match_fingerprint)
        VALUES (${req.name}, ${req.description ?? null}, ${req.matchFingerprint})
        RETURNING id, name, description, created_at, updated_at
      `;

      // Insert all the ROIs for the template
      const rois: TemplateROI[] = [];
      for (const roi of req.rois) {
        const roiResult = await db.queryRow<any>`
          INSERT INTO template_rois (template_id, name, x, y, width, height)
          VALUES (${templateResult.id}, ${roi.name}, ${roi.x}, ${roi.y}, ${roi.width}, ${roi.height})
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
  }
);
