import PDFDocument from "pdfkit";
import type { DocumentStructure, DocumentElement, DocumentStyle, TableCell } from "../types";

type AssetLoader = (src: string) => Promise<Buffer | null>;

interface PdfOptions {
  backgroundImage?: Buffer;
  assetLoader?: AssetLoader;
  fonts?: {
    regular?: Buffer;
    bold?: Buffer;
    italic?: Buffer;
    boldItalic?: Buffer;
  };
}

export async function generatePdf(
  structure: DocumentStructure,
  mode: "exact" | "editable",
  opts?: PdfOptions
): Promise<Buffer> {
  const pageSize: [number, number] =
    structure.metadata.orientation === "portrait"
      ? [structure.metadata.dimensions.width, structure.metadata.dimensions.height]
      : [structure.metadata.dimensions.height, structure.metadata.dimensions.width];

  const doc = new PDFDocument({
    size: pageSize,
    margin: 50,
    autoFirstPage: true,
  });

  // Fonts
  if (opts?.fonts?.regular) doc.registerFont("Fallback", opts.fonts.regular);
  if (opts?.fonts?.bold) doc.registerFont("Fallback-Bold", opts.fonts.bold);
  if (opts?.fonts?.italic) doc.registerFont("Fallback-Italic", opts.fonts.italic);
  if (opts?.fonts?.boldItalic) doc.registerFont("Fallback-BoldItalic", opts.fonts.boldItalic);

  const chunks: Buffer[] = [];
  return await new Promise<Buffer>(async (resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (mode === "exact" && opts?.backgroundImage) {
      // Draw background original image to mimic facsimile
      doc.save();
      doc.image(opts.backgroundImage, 0, 0, {
        width: pageSize[0],
        height: pageSize[1],
      });
      doc.restore();
    }

    if (mode === "exact") {
      for (const el of structure.elements) {
        await drawElementExact(doc, el, opts?.assetLoader);
      }
    } else {
      for (const el of structure.elements) {
        await drawElementFlow(doc, el, opts?.assetLoader);
      }
    }

    doc.end();
  });
}

async function drawElementFlow(doc: PDFDocument, el: DocumentElement, assetLoader?: AssetLoader) {
  const fontSize = el.style?.fontSize ?? (el.type === "heading" ? 18 : 12);
  const align = el.style?.textAlign ?? "left";
  setFont(doc, el.style, el.type === "heading");

  if (el.type === "heading") {
    doc.moveDown(0.6);
    doc.text(el.content, { align, fillColor: colorOf(el.style) });
  } else if (el.type === "list") {
    const items = el.content.split("\n").filter(i => i.trim());
    for (const i of items) {
      const clean = i.replace(/^[•\-\*\u2022]\s*/, "");
      doc.text("• " + clean, { align, fillColor: colorOf(el.style) });
    }
    doc.moveDown(0.5);
  } else if (el.type === "table" && el.table) {
    drawTableFlow(doc, el.table.rows, el.style);
  } else if (el.type === "image" && el.imageSrc && assetLoader) {
    const buf = await assetLoader(el.imageSrc);
    if (buf) {
      const w = Math.max(24, Math.floor(el.imageWidth ?? el.position.width));
      const h = Math.max(24, Math.floor(el.imageHeight ?? el.position.height));
      doc.image(buf, { width: w, height: h });
      doc.moveDown(0.5);
    }
  } else {
    doc.fontSize(fontSize);
    applyDecoration(doc, el.style);
    doc.text(el.content, { align, fillColor: colorOf(el.style) });
    doc.moveDown(0.3);
  }
}

async function drawElementExact(doc: PDFDocument, el: DocumentElement, assetLoader?: AssetLoader) {
  const x = el.position.x;
  const y = el.position.y;
  const width = el.position.width;
  setFont(doc, el.style, el.type === "heading");

  if (el.type === "heading") {
    doc.save();
    doc.fontSize(el.style?.fontSize ?? 18);
    applyDecoration(doc, el.style);
    doc.fillColor(colorOf(el.style));
    doc.text(el.content, x, y, { width, align: el.style?.textAlign ?? "left" });
    doc.restore();
  } else if (el.type === "list") {
    doc.save();
    doc.fontSize(el.style?.fontSize ?? 12);
    doc.fillColor(colorOf(el.style));
    const items = el.content.split("\n").filter(i => i.trim());
    let offsetY = y;
    for (const i of items) {
      const clean = i.replace(/^[•\-\*\u2022]\s*/, "");
      doc.text("• " + clean, x, offsetY, { width, align: el.style?.textAlign ?? "left" });
      offsetY += (el.style?.fontSize ?? 12) + 4;
    }
    doc.restore();
  } else if (el.type === "table" && el.table) {
    drawTableExact(doc, x, y, width, el.table.rows, el.style);
  } else if (el.type === "image" && el.imageSrc && assetLoader) {
    const buf = await assetLoader(el.imageSrc);
    if (buf) {
      const w = Math.max(24, Math.floor(el.imageWidth ?? el.position.width));
      const h = Math.max(24, Math.floor(el.imageHeight ?? el.position.height));
      doc.image(buf, x, y, { width: w, height: h });
    }
  } else {
    doc.save();
    doc.fontSize(el.style?.fontSize ?? 12);
    applyDecoration(doc, el.style);
    doc.fillColor(colorOf(el.style));
    doc.text(el.content, x, y, { width, align: el.style?.textAlign ?? "left" });
    doc.restore();
  }
}

function setFont(doc: PDFDocument, style?: DocumentStyle, preferBold?: boolean) {
  const bold = style?.fontWeight === "bold" || preferBold;
  const italic = style?.fontStyle === "italic";
  // Prefer registered fonts
  if (bold && italic && hasFont(doc, "Fallback-BoldItalic")) return doc.font("Fallback-BoldItalic");
  if (bold && hasFont(doc, "Fallback-Bold")) return doc.font("Fallback-Bold");
  if (italic && hasFont(doc, "Fallback-Italic")) return doc.font("Fallback-Italic");
  if (hasFont(doc, "Fallback")) return doc.font("Fallback");
  // Fallback to built-ins
  if (bold && italic) return doc.font("Helvetica-Bold");
  if (bold) return doc.font("Helvetica-Bold");
  if (italic) return doc.font("Helvetica-Oblique");
  return doc.font("Helvetica");
}

function hasFont(doc: PDFDocument, name: string): boolean {
  try {
    // @ts-ignore private API but safe in practice
    const fonts = doc._fontFamilies || {};
    return !!fonts[name];
  } catch {
    return false;
  }
}

function colorOf(style?: DocumentStyle): string {
  return style?.color ?? "#111111";
}

function applyDecoration(doc: PDFDocument, style?: DocumentStyle) {
  if (style?.textDecoration === "underline") {
    doc.underline();
  } else if (style?.textDecoration === "line-through") {
    doc.strike();
  }
}

function drawTableFlow(doc: PDFDocument, rows: TableCell[][], style?: DocumentStyle) {
  const cellPadding = 4;
  const colCount = Math.max(...rows.map(r => r.length));
  const tableWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right);
  const colWidth = tableWidth / colCount;

  for (const row of rows) {
    let maxHeight = 0;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const text = cell.text;
      doc.save();
      doc.fontSize(cell.style?.fontSize ?? style?.fontSize ?? 11);
      setFont(doc, cell.style ?? style);
      const h = doc.heightOfString(text, { width: colWidth - cellPadding * 2 });
      maxHeight = Math.max(maxHeight, h);
      doc.restore();
    }
    // Draw row
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const text = cell.text;
      const x = doc.x + c * colWidth;
      const y = doc.y;
      doc.rect(x, y, colWidth, maxHeight + cellPadding * 2).strokeColor("#e5e7eb").stroke();
      doc.save();
      doc.fontSize(cell.style?.fontSize ?? style?.fontSize ?? 11);
      setFont(doc, cell.style ?? style);
      doc.fillColor(colorOf(cell.style ?? style));
      doc.text(text, x + cellPadding, y + cellPadding, { width: colWidth - cellPadding * 2 });
      doc.restore();
    }
    doc.y += maxHeight + cellPadding * 2;
  }
}

function drawTableExact(doc: PDFDocument, x0: number, y0: number, width: number, rows: TableCell[][], style?: DocumentStyle) {
  const colCount = Math.max(...rows.map(r => r.length));
  const colWidth = width / colCount;
  const cellPadding = 3;
  let y = y0;
  for (const row of rows) {
    let rowHeight = 0;
    // measure
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      doc.save();
      doc.fontSize(cell.style?.fontSize ?? style?.fontSize ?? 11);
      setFont(doc, cell.style ?? style);
      const h = doc.heightOfString(cell.text, { width: colWidth - cellPadding * 2 });
      rowHeight = Math.max(rowHeight, h + cellPadding * 2);
      doc.restore();
    }
    // draw
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const x = x0 + c * colWidth;
      doc.rect(x, y, colWidth, rowHeight).strokeColor("#e5e7eb").stroke();
      doc.save();
      doc.fontSize(cell.style?.fontSize ?? style?.fontSize ?? 11);
      setFont(doc, cell.style ?? style);
      doc.fillColor(colorOf(cell.style ?? style));
      doc.text(cell.text, x + cellPadding, y + cellPadding, { width: colWidth - cellPadding * 2 });
      doc.restore();
    }
    y += rowHeight;
  }
}
