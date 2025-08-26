import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import { processedDocuments } from "./storage";
import type { ConversionRequest, ConversionResponse, DocumentStructure } from "./types";
import { generateHTML } from "./exporters/html";
import { generateMarkdown } from "./exporters/markdown";
import { generateDocx } from "./exporters/docx";
import { generatePdf } from "./exporters/pdf";

// Converts a processed document to the specified format.
export const convert = api<ConversionRequest, ConversionResponse>(
  { expose: true, method: "POST", path: "/document/convert" },
  async (req) => {
    // Validate req
    if (!req.documentId) {
      throw APIError.invalidArgument("missing documentId");
    }

    // Get document
    const document = await documentDB.queryRow<{
      id: string;
      extracted_text: string | null;
      document_structure: string | null;
      processing_status: string;
      original_filename: string;
    }>`
      SELECT id, extracted_text, document_structure, processing_status, original_filename
      FROM documents
      WHERE id = ${req.documentId}
    `;

    if (!document) {
      throw APIError.notFound("document not found");
    }

    if (document.processing_status !== "completed") {
      throw APIError.failedPrecondition("document processing not completed");
    }

    if (!document.document_structure && !document.extracted_text) {
      throw APIError.failedPrecondition("no content to convert");
    }

    const documentStructure: DocumentStructure | undefined = document.document_structure
      ? JSON.parse(document.document_structure)
      : undefined;

    // Generate content based on format and mode
    let buffer: Buffer;
    let contentType: string;
    let ext = req.format;

    switch (req.format) {
      case "txt": {
        const text = document.extracted_text ?? "";
        buffer = Buffer.from(text, "utf8");
        contentType = "text/plain; charset=utf-8";
        break;
      }
      case "markdown": {
        const md = generateMarkdown(
          documentStructure ?? fallbackStructureFromText(document.extracted_text ?? ""),
          req.mode
        );
        buffer = Buffer.from(md, "utf8");
        contentType = "text/markdown; charset=utf-8";
        ext = "md";
        break;
      }
      case "html": {
        const html = generateHTML(
          documentStructure ?? fallbackStructureFromText(document.extracted_text ?? ""),
          req.mode
        );
        buffer = Buffer.from(html, "utf8");
        contentType = "text/html; charset=utf-8";
        break;
      }
      case "docx": {
        const docx = await generateDocx(
          documentStructure ?? fallbackStructureFromText(document.extracted_text ?? ""),
          req.mode
        );
        buffer = docx;
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      }
      case "pdf": {
        const pdf = await generatePdf(
          documentStructure ?? fallbackStructureFromText(document.extracted_text ?? ""),
          req.mode
        );
        buffer = pdf;
        contentType = "application/pdf";
        break;
      }
      default:
        throw APIError.invalidArgument(`unsupported format: ${req.format}`);
    }

    // Save to storage
    const safeBase = document.original_filename.replace(/\.[^.]+$/, "");
    const filename = `${safeBase}_${req.mode}.${ext}`;
    const filePath = `converted/${req.documentId}/${filename}`;

    await processedDocuments.upload(filePath, buffer, {
      contentType,
    });

    // Create output record
    const output = await documentDB.queryRow<{ id: string }>`
      INSERT INTO document_outputs (document_id, format, file_path, file_size)
      VALUES (${req.documentId}, ${req.format}, ${filePath}, ${buffer.length})
      RETURNING id
    `;

    if (!output) {
      throw APIError.internal("failed to create output record");
    }

    // Generate download URL
    const { url } = await processedDocuments.signedDownloadUrl(filePath, { ttl: 3600 });

    return {
      outputId: output.id,
      downloadUrl: url,
    };
  }
);

// Fallback structure builder when only text exists.
function fallbackStructureFromText(text: string): DocumentStructure {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const elements = [];
  for (const l of lines) {
    if (!l) continue;
    if (/^[#\-\*\u2022]/.test(l) || /^\d+[\.\)]/.test(l)) {
      elements.push({
        type: "list",
        content: l,
        position: { x: 50, y: 50, width: 500, height: 14 },
        style: { fontSize: 12 },
      });
    } else if (/[:：]$/.test(l) || (l.length < 40 && /[A-Z]/.test(l) && l === l.toUpperCase())) {
      elements.push({
        type: "heading",
        content: l.replace(/[:：]$/, ""),
        level: 2,
        position: { x: 50, y: 50, width: 500, height: 20 },
        style: { fontSize: 18, fontWeight: "bold" },
      });
    } else {
      elements.push({
        type: "paragraph",
        content: l,
        position: { x: 50, y: 50, width: 500, height: 14 },
        style: { fontSize: 12 },
      });
    }
  }
  return {
    elements,
    metadata: { pageCount: 1, orientation: "portrait", dimensions: { width: 595, height: 842 } },
  };
}
