import { api } from "encore.dev/api";
import { documentDB } from "./db";
import { processedDocuments } from "./storage";
import type { ConversionRequest, ConversionResponse, Document, DocumentStructure } from "./types";

// Converts a processed document to the specified format.
export const convert = api<ConversionRequest, ConversionResponse>(
  { expose: true, method: "POST", path: "/document/convert" },
  async (req) => {
    // Get document
    const document = await documentDB.queryRow<{
      id: string;
      extracted_text: string;
      document_structure: string;
      processing_status: string;
    }>`
      SELECT id, extracted_text, document_structure, processing_status
      FROM documents
      WHERE id = ${req.documentId}
    `;

    if (!document) {
      throw new Error("Document not found");
    }

    if (document.processing_status !== "completed") {
      throw new Error("Document processing not completed");
    }

    const documentStructure: DocumentStructure = JSON.parse(document.document_structure);

    // Generate document content based on format and mode
    const content = await generateDocument(
      document.extracted_text,
      documentStructure,
      req.format,
      req.mode
    );

    // Save to storage
    const filename = `${req.documentId}_${req.mode}.${req.format}`;
    const filePath = `converted/${filename}`;
    
    await processedDocuments.upload(filePath, Buffer.from(content));

    // Create output record
    const output = await documentDB.queryRow<{ id: string }>`
      INSERT INTO document_outputs (document_id, format, file_path, file_size)
      VALUES (${req.documentId}, ${req.format}, ${filePath}, ${content.length})
      RETURNING id
    `;

    if (!output) {
      throw new Error("Failed to create output record");
    }

    // Generate download URL
    const { url } = await processedDocuments.signedDownloadUrl(filePath, { ttl: 3600 });

    return {
      outputId: output.id,
      downloadUrl: url,
    };
  }
);

async function generateDocument(
  extractedText: string,
  structure: DocumentStructure,
  format: string,
  mode: "exact" | "editable"
): Promise<string> {
  switch (format) {
    case "txt":
      return extractedText;

    case "markdown":
      return generateMarkdown(structure, mode);

    case "html":
      return generateHTML(structure, mode);

    case "docx":
      // In a real implementation, this would use a library like docx
      return generateDocxPlaceholder(structure, mode);

    case "pdf":
      // In a real implementation, this would use a library like PDFKit
      return generatePdfPlaceholder(structure, mode);

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function generateMarkdown(structure: DocumentStructure, mode: string): string {
  let markdown = "";

  for (const element of structure.elements) {
    switch (element.type) {
      case "heading":
        const level = element.level || 1;
        markdown += `${"#".repeat(level)} ${element.content}\n\n`;
        break;

      case "paragraph":
        markdown += `${element.content}\n\n`;
        break;

      case "list":
        const listItems = element.content.split("\n").filter(item => item.trim());
        for (const item of listItems) {
          markdown += `${item}\n`;
        }
        markdown += "\n";
        break;

      default:
        markdown += `${element.content}\n\n`;
    }
  }

  return markdown;
}

function generateHTML(structure: DocumentStructure, mode: string): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Converted Document</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { font-size: 24px; margin-bottom: 20px; }
    h2 { font-size: 18px; margin-bottom: 15px; }
    p { margin-bottom: 15px; }
    ul { margin-bottom: 15px; }
  </style>
</head>
<body>
`;

  for (const element of structure.elements) {
    switch (element.type) {
      case "heading":
        const level = Math.min(element.level || 1, 6);
        html += `<h${level}>${element.content}</h${level}>\n`;
        break;

      case "paragraph":
        html += `<p>${element.content}</p>\n`;
        break;

      case "list":
        html += "<ul>\n";
        const listItems = element.content.split("\n").filter(item => item.trim());
        for (const item of listItems) {
          const cleanItem = item.replace(/^[•\-\*]\s*/, "");
          html += `<li>${cleanItem}</li>\n`;
        }
        html += "</ul>\n";
        break;

      default:
        html += `<p>${element.content}</p>\n`;
    }
  }

  html += "</body>\n</html>";
  return html;
}

function generateDocxPlaceholder(structure: DocumentStructure, mode: string): string {
  // This would use a library like 'docx' to generate actual DOCX files
  return `DOCX content placeholder for ${structure.elements.length} elements in ${mode} mode`;
}

function generatePdfPlaceholder(structure: DocumentStructure, mode: string): string {
  // This would use a library like 'PDFKit' to generate actual PDF files
  return `PDF content placeholder for ${structure.elements.length} elements in ${mode} mode`;
}
