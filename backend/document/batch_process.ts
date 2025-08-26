import { api } from "encore.dev/api";
import { documentDB } from "./db";
import { originalImages, processedDocuments } from "./storage";
import type { BatchProcessRequest, BatchProcessResponse, DocumentStructure } from "./types";
import { processImageToStructure } from "./processors";
import { generateDocx } from "./exporters/docx";
import { generatePdf } from "./exporters/pdf";
import { generateHTML } from "./exporters/html";
import { generateMarkdown } from "./exporters/markdown";

// Batch processes multiple documents and optionally converts them.
export const batchProcess = api<BatchProcessRequest, BatchProcessResponse>(
  { expose: true, method: "POST", path: "/documents/batch/process" },
  async (req) => {
    const results = await Promise.all(
      req.documentIds.map(async (id) => {
        try {
          const doc = await documentDB.queryRow<{
            id: string;
            original_filename: string;
            mime_type: string;
          }>`
            SELECT id, original_filename, mime_type FROM documents WHERE id = ${id}
          `;
          if (!doc) {
            return { documentId: id, status: "failed" as const, error: "not found" };
          }

          // Download the image
          const imageBuffer = await originalImages.download(`${doc.id}/${doc.original_filename}`);

          // Process
          const { text, structure, language } = await processImageToStructure(imageBuffer, doc.mime_type);

          await documentDB.exec`
            UPDATE documents 
            SET 
              processing_status = 'completed',
              extracted_text = ${text},
              detected_language = ${language},
              document_structure = ${JSON.stringify(structure)},
              updated_at = NOW()
            WHERE id = ${id}
          `;

          if (!req.convertTo) {
            return { documentId: id, status: "completed" as const };
          }

          // Generate conversion
          let buffer: Buffer;
          let contentType: string;
          let ext = req.convertTo;

          switch (req.convertTo) {
            case "docx":
              buffer = await generateDocx(structure, req.mode ?? "editable");
              contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
              break;
            case "pdf":
              buffer = await generatePdf(structure, req.mode ?? "editable");
              contentType = "application/pdf";
              break;
            case "html":
              buffer = Buffer.from(generateHTML(structure, req.mode ?? "editable"), "utf8");
              contentType = "text/html; charset=utf-8";
              break;
            case "markdown":
              buffer = Buffer.from(generateMarkdown(structure, req.mode ?? "editable"), "utf8");
              contentType = "text/markdown; charset=utf-8";
              ext = "md";
              break;
            case "txt":
              buffer = Buffer.from(text, "utf8");
              contentType = "text/plain; charset=utf-8";
              break;
            default:
              buffer = Buffer.from(text, "utf8");
              contentType = "text/plain; charset=utf-8";
          }

          const safeBase = doc.original_filename.replace(/\.[^.]+$/, "");
          const filename = `${safeBase}_${req.mode ?? "editable"}.${ext}`;
          const filePath = `converted/${id}/${filename}`;
          await processedDocuments.upload(filePath, buffer, { contentType });
          const output = await documentDB.queryRow<{ id: string }>`
            INSERT INTO document_outputs (document_id, format, file_path, file_size)
            VALUES (${id}, ${req.convertTo}, ${filePath}, ${buffer.length})
            RETURNING id
          `;
          const { url } = await processedDocuments.signedDownloadUrl(filePath, { ttl: 3600 });

          return {
            documentId: id,
            status: "completed" as const,
            conversion: { outputId: output!.id, downloadUrl: url },
          };
        } catch (err: any) {
          return {
            documentId: id,
            status: "failed" as const,
            error: err?.message ?? "unknown error",
          };
        }
      })
    );

    return { results };
  }
);
