import PDFDocument from "pdfkit";
import type { DocumentStructure, DocumentElement } from "../types";

export async function generatePdf(structure: DocumentStructure, mode: "exact" | "editable"): Promise<Buffer> {
  const doc = new PDFDocument({
    size: structure.metadata.orientation === "portrait" ? [structure.metadata.dimensions.width, structure.metadata.dimensions.height] : [structure.metadata.dimensions.height, structure.metadata.dimensions.width],
    margin: 50,
    autoFirstPage: true,
  });

  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (mode === "exact") {
      // Draw using absolute positioning
      for (const el of structure.elements) {
        drawElementExact(doc, el);
      }
    } else {
      // Flow layout for editable mode
      for (const el of structure.elements) {
        drawElementFlow(doc, el);
      }
    }

    doc.end();
  });
}

function drawElementFlow(doc: PDFDocument, el: DocumentElement) {
  const fontSize = el.style?.fontSize ?? (el.type === "heading" ? 18 : 12);
  const align = el.style?.textAlign ?? "left";
  doc.fontSize(fontSize);

  if (el.type === "heading") {
    doc.moveDown(0.6);
    doc.font("Helvetica-Bold");
    doc.text(el.content, { align });
    doc.font("Helvetica");
  } else if (el.type === "list") {
    const items = el.content.split("\n").filter(i => i.trim());
    for (const i of items) {
      const clean = i.replace(/^[•\-\*\u2022]\s*/, "");
      doc.text("• " + clean, { align });
    }
    doc.moveDown(0.5);
  } else {
    doc.text(el.content, { align });
    doc.moveDown(0.3);
  }
}

function drawElementExact(doc: PDFDocument, el: DocumentElement) {
  const x = el.position.x;
  const y = el.position.y;
  const width = el.position.width;
  const fontSize = el.style?.fontSize ?? (el.type === "heading" ? 18 : 12);
  const align = el.style?.textAlign ?? "left";

  if (el.type === "heading") {
    doc.save();
    doc.font("Helvetica-Bold");
    doc.fontSize(fontSize);
    doc.text(el.content, x, y, { width, align });
    doc.restore();
  } else if (el.type === "list") {
    doc.save();
    doc.font("Helvetica");
    doc.fontSize(fontSize);
    const items = el.content.split("\n").filter(i => i.trim());
    let offsetY = y;
    for (const i of items) {
      const clean = i.replace(/^[•\-\*\u2022]\s*/, "");
      doc.text("• " + clean, x, offsetY, { width, align });
      offsetY += fontSize + 4;
    }
    doc.restore();
  } else {
    doc.save();
    doc.font("Helvetica");
    doc.fontSize(fontSize);
    doc.text(el.content, x, y, { width, align });
    doc.restore();
  }
}
