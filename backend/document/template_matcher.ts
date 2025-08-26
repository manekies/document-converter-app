import { phash } from "phash-im";
import { documentDB } from "./db";
import type { DocumentMatchingTemplate, TemplateROI } from "./types";

const HAMMING_DISTANCE_THRESHOLD = 5; // How similar images need to be to be considered a match. Lower is more similar.

/**
 * Calculates the Hamming distance between two hash strings.
 * The Hamming distance is the number of positions at which the corresponding symbols are different.
 */
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    // This should not happen if fingerprints are generated correctly.
    return Infinity;
  }
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

/**
 * Finds the best matching template for a given image buffer by comparing perceptual hashes.
 * @param imageBuffer The buffer of the image to match.
 * @returns The full document template object if a close match is found, otherwise null.
 */
export async function findMatchingTemplate(imageBuffer: Buffer): Promise<DocumentMatchingTemplate | null> {
  try {
    // 1. Compute the pHash of the input image.
    const imageHash = await phash(imageBuffer);

    // 2. Fetch all template fingerprints from the database.
    const templates = await documentDB.query<{ id: string; match_fingerprint: string }>`
      SELECT id, match_fingerprint FROM document_templates WHERE match_fingerprint IS NOT NULL
    `;

    if (templates.rows.length === 0) {
      return null;
    }

    // 3. Find the best match by comparing Hamming distances.
    let bestMatch: { id: string; distance: number } | null = null;

    for (const template of templates.rows) {
      const distance = hammingDistance(imageHash, template.match_fingerprint);
      if (distance < HAMMING_DISTANCE_THRESHOLD) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { id: template.id, distance };
        }
      }
    }

    // 4. If a good enough match is found, fetch the full template data for that template.
    if (bestMatch) {
      const templateData = await documentDB.queryRow<Omit<DocumentMatchingTemplate, "rois">>`
        SELECT id, name, description, created_at, updated_at
        FROM document_templates
        WHERE id = ${bestMatch.id}
      `;

      if (!templateData) return null; // Should not happen if we just found the ID

      const roisResult = await documentDB.query<TemplateROI>`
        SELECT id, name, x, y, width, height
        FROM template_rois
        WHERE template_id = ${bestMatch.id}
      `;

      return {
        ...templateData,
        rois: roisResult.rows,
      };
    }

    return null;
  } catch (error) {
    // Log the error but don't let template matching failures block the entire processing pipeline.
    console.error("Failed to perform template matching:", error);
    return null;
  }
}
