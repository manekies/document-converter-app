import { api, StreamOut } from "encore.dev/api";
import { documentDB } from "./db";
import { originalImages, processedDocuments } from "./storage";
import { processImageToStructure } from "./processors";
import { generateDocx } from "./exporters/docx";
import { generatePdf } from "./exporters/pdf";
import { generateHTML } from "./exporters/html";
import { generateMarkdown } from "./exporters/markdown";
import type { BatchStreamHandshake, BatchProgressEvent, OutputFormat } from "./types";
import { loadTemplate } from "./exporters/templates";
import { loadFonts } from "./style/fonts";

export const batchProcessStream = api.streamOut<BatchStreamHandshake, BatchProgressEvent>(
  { expose: true, path: "/documents/batch/stream" },
  async (handshake, stream) => {
    const job = await documentDB.queryRow<{ id: string }>`
      INSERT INTO batch_jobs (total) VALUES (${handshake.documentIds.length})
      RETURNING id
    `;
    const jobId = job!.id;

    for (const id of handshake.documentIds) {
      await streamEvent(stream, { documentId: id, status: "queued", progress: 0, message: "Queued" });
      await documentDB.exec`
        INSERT INTO batch_job_items (job_id, document_id, status) VALUES (${jobId}, ${id}, 'queued')
      `;

      const started = Date.now();
      try {
        const doc = await documentDB.queryRow<{
          id: string;
          original_filename: string;
          mime_type: string;
        }>`
          SELECT id, original_filename, mime_type FROM documents WHERE id = ${id}
        `;
        if (!doc) {
          await recordItem(jobId, id, "failed");
          await streamEvent(stream, { documentId: id, status: "failed", progress: 0, error: "not found" });
          continue;
        }

        await streamEvent(stream, { documentId: id, status: "processing", progress: 10, message: "Downloading image" });

        const imageBuffer = await originalImages.download(`${doc.id}/${doc.original_filename}`);

        await streamEvent(stream, { documentId: id, status: "processing", progress: 30, message: "Running OCR" });

        const { text, structure, language, confidence, ocrProvider, llmProvider } =
          await processImageToStructure(imageBuffer, doc.mime_type, {
            mode: handshake.processingMode ?? "auto",
            quality: "best",
            languages: handshake.languages,
          });

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

        const duration = Date.now() - started;
        await documentDB.exec`
          INSERT INTO processing_runs (document_id, mode, ocr_provider, llm_provider, confidence, text_length, duration_ms, status)
          VALUES (${id}, ${handshake.processingMode ?? "auto"}, ${ocrProvider}, ${llmProvider ?? null}, ${confidence}, ${text.length}, ${duration}, 'completed')
        `;

        await streamEvent(stream, { documentId: id, status: "processing", progress: 70, message: "Processed" });

        if (!handshake.convertTo) {
          await recordItem(jobId, id, "completed");
          await streamEvent(stream, { documentId: id, status: "completed", progress: 100, message: "Done" });
          continue;
        }

        await streamEvent(stream, { documentId: id, status: "converting", progress: 75, message: "Converting" });

        const { buffer, contentType, ext } = await convertBuffer(id, doc.original_filename, handshake.convertTo, text, structure.metadata.template, handshake.mode);
        const safeBase = doc.original_filename.replace(/\.[^.]+$/, "");
        const filename = `${safeBase}_${handshake.mode ?? "editable"}.${ext}`;
        const filePath = `converted/${id}/${filename}`;
        await processedDocuments.upload(filePath, buffer, { contentType });

        const output = await documentDB.queryRow<{ id: string }>`
          INSERT INTO document_outputs (document_id, format, file_path, file_size)
          VALUES (${id}, ${handshake.convertTo}, ${filePath}, ${buffer.length})
          RETURNING id
        `;
        const { url } = await processedDocuments.signedDownloadUrl(filePath, { ttl: 3600 });
        await recordItem(jobId, id, "completed");
        await streamEvent(stream, { documentId: id, status: "completed", progress: 100, message: "Done", outputId: output!.id, downloadUrl: url });
      } catch (err: any) {
        await recordItem(jobId, id, "failed");
        await streamEvent(stream, { documentId: id, status: "failed", progress: 100, error: err?.message ?? "unknown error" });
      }
    }
  }
);

async function convertBuffer(
  documentId: string,
  originalFilename: string,
  fmt: OutputFormat,
  text: string,
  templateName?: string,
  mode?: "exact" | "editable",
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const structureRow = await documentDB.queryRow<{ document_structure: string | null }>`
    SELECT document_structure FROM documents WHERE id = ${documentId}
  `;
  const structure = structureRow?.document_structure ? JSON.parse(structureRow.document_structure) as any : undefined;
  const assetLoader = async (src: string) => {
    try {
      const inProcessed = await processedDocuments.exists(src).catch(() => false);
      if (inProcessed) {
        return await processedDocuments.download(src);
      }
      const inOriginal = await originalImages.exists(src).catch(() => false);
      if (inOriginal) {
        return await originalImages.download(src);
      }
    } catch {
      // ignore
    }
    return null;
  };

  let buffer: Buffer;
  let contentType: string;
  let ext = fmt;
  const template = await loadTemplate(templateName);
  const fonts = await loadFonts(structure?.metadata?.fontFamily);

  switch (fmt) {
    case "docx":
      buffer = await generateDocx(structure, mode ?? "editable", assetLoader, template);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      break;
    case "pdf": {
      const bgImage = mode === "exact"
        ? await originalImages.download(`${documentId}/${originalFilename}`).catch(() => undefined)
        : undefined;
      buffer = await generatePdf(structure, mode ?? "editable", { backgroundImage: bgImage, assetLoader, fonts, template });
      contentType = "application/pdf";
      break;
    }
    case "html": {
      const bgImage = mode === "exact"
        ? await originalImages.download(`${documentId}/${originalFilename}`).catch(() => undefined)
        : undefined;
      const html = await generateHTML(structure, mode ?? "editable", assetLoader, { template, backgroundImage: bgImage });
      buffer = Buffer.from(html, "utf8");
      contentType = "text/html; charset=utf-8";
      break;
    }
    case "markdown": {
      const md = generateMarkdown(structure, mode ?? "editable");
      buffer = Buffer.from(md, "utf8");
      contentType = "text/markdown; charset=utf-8";
      ext = "md";
      break;
    }
    case "txt":
      buffer = Buffer.from(text ?? "", "utf8");
      contentType = "text/plain; charset=utf-8";
      break;
    default:
      buffer = Buffer.from(text ?? "", "utf8");
      contentType = "text/plain; charset=utf-8";
  }
  return { buffer, contentType, ext };
}

async function streamEvent(stream: StreamOut<BatchProgressEvent>, ev: BatchProgressEvent) {
  try {
    await stream.send(ev);
  } catch {
    // ignore stream errors (client may disconnect)
  }
}

async function recordItem(jobId: string, documentId: string, status: string) {
  await documentDB.exec`
    UPDATE batch_job_items SET status = ${status}, updated_at = NOW()
    WHERE job_id = ${jobId} AND document_id = ${documentId}
  `;
  await documentDB.exec`
    UPDATE batch_jobs 
    SET completed = completed + ${status === "completed" || status === "failed" ? 1 : 0}, updated_at = NOW()
    WHERE id = ${jobId}
  `;
}
