import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import { generateHTML } from "./exporters/html";
import type { PreviewRequest, PreviewResponse, DocumentStructure } from "./types";

// Returns an HTML preview for the document.
export const previewHtml = api<PreviewRequest, PreviewResponse>(
  { expose: true, method: "GET", path: "/document/:id/preview" },
  async (req) => {
    if (!req.id) {
      throw APIError.invalidArgument("missing id");
    }
    const doc = await documentDB.queryRow<{
      document_structure: string | null;
      extracted_text: string | null;
      processing_status: string;
    }>`
      SELECT document_structure, extracted_text, processing_status
      FROM documents
      WHERE id = ${req.id}
    `;
    if (!doc) {
      throw APIError.notFound("document not found");
    }
    if (doc.processing_status !== "completed") {
      throw APIError.failedPrecondition("document not processed");
    }
    const structure: DocumentStructure | undefined = doc.document_structure
      ? JSON.parse(doc.document_structure)
      : undefined;

    const html = generateHTML(
      structure ?? {
        elements: [
          {
            type: "paragraph",
            content: doc.extracted_text ?? "",
            position: { x: 50, y: 50, width: 500, height: 14 },
            style: { fontSize: 12 },
          },
        ],
        metadata: { pageCount: 1, orientation: "portrait", dimensions: { width: 595, height: 842 } },
      },
      req.mode ?? "editable"
    );

    return { html };
  }
);
