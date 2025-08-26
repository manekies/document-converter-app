import {
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  ImageRun,
  AlignmentType
} from "docx";
import type { DocumentElement, DocumentStructure, DocumentStyle, TableCell, TemplateStyles } from "../types";

type AssetLoader = (src: string) => Promise<Buffer | null>;

export async function generateDocx(
  structure: DocumentStructure,
  mode: "exact" | "editable",
  assetLoader?: AssetLoader,
  template?: TemplateStyles
): Promise<Buffer> {
  const children: (Paragraph | DocxTable)[] = [];

  for (const el of structure.elements) {
    if (el.type === "table" && el.table) {
      children.push(buildTable(el.table.rows));
      continue;
    }
    if (el.type === "image" && el.imageSrc && assetLoader) {
      const buf = await assetLoader(el.imageSrc);
      if (buf) {
        const w = Math.max(24, Math.floor(el.imageWidth ?? el.position.width));
        const h = Math.max(24, Math.floor(el.imageHeight ?? el.position.height));
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: buf,
                transformation: { width: w, height: h }
              }),
            ],
            alignment: alignmentFromStyle(el.style),
          })
        );
        continue;
      }
    }
    // headings, lists, paragraphs, formulas fallback to paragraphs
    if (el.type === "list") {
      const items = el.content.split("\n").filter(i => i.trim());
      for (const item of items) {
        const clean = item.replace(/^[•\-\*\u2022]\s*/, "");
        children.push(
          new Paragraph({
            children: [styleRun(clean, mergedStyle(el.style, template?.list))],
            bullet: { level: 0 },
            alignment: alignmentFromStyle(el.style),
            spacing: mode === "exact" ? { line: lineHeightToTwips(el.style.lineHeight) } : undefined,
          })
        );
      }
      continue;
    }
    if (el.type === "heading") {
      const level = Math.min(el.level || 2, 6);
      const headingStyle = headingStyleForLevel(template, level);
      children.push(
        new Paragraph({
          children: [styleRun(el.content, mergedStyle({ ...el.style, fontWeight: "bold" }, headingStyle))],
          heading:
            level === 1 ? HeadingLevel.HEADING_1 :
            level === 2 ? HeadingLevel.HEADING_2 :
            level === 3 ? HeadingLevel.HEADING_3 :
            level === 4 ? HeadingLevel.HEADING_4 :
            level === 5 ? HeadingLevel.HEADING_5 :
            HeadingLevel.HEADING_6,
          alignment: alignmentFromStyle(el.style),
          spacing: mode === "exact" ? { line: lineHeightToTwips(el.style.lineHeight) } : undefined,
        })
      );
      continue;
    }
    // paragraph / formula
    children.push(
      new Paragraph({
        children: [styleRun(el.content, mergedStyle(el.style, template?.paragraph))],
        alignment: alignmentFromStyle(el.style),
        spacing: mode === "exact" ? { line: lineHeightToTwips(el.style.lineHeight) } : undefined,
      })
    );
  }

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

function mergedStyle(base?: DocumentStyle, extra?: Partial<DocumentStyle>): DocumentStyle {
  return { ...(extra ?? {}), ...(base ?? {}) };
}

function headingStyleForLevel(tpl: TemplateStyles | undefined, level: number): Partial<DocumentStyle> | undefined {
  if (!tpl?.headings) return undefined;
  if (level === 1) return tpl.headings.h1;
  if (level === 2) return tpl.headings.h2;
  if (level === 3) return tpl.headings.h3;
  if (level === 4) return tpl.headings.h4;
  if (level === 5) return tpl.headings.h5;
  return tpl.headings.h6;
}

function styleRun(text: string, style?: DocumentStyle): TextRun {
  const sizeHalfPoints = style?.fontSize ? Math.round(pxToHalfPoints(style.fontSize)) : undefined;
  const color = style?.color ? style.color.replace(/^#/, "") : undefined;
  const underline = style?.textDecoration === "underline";
  const strike = style?.textDecoration === "line-through";
  return new TextRun({
    text,
    bold: style?.fontWeight === "bold",
    italics: style?.fontStyle === "italic",
    size: sizeHalfPoints,
    color,
    font: style?.fontFamily,
    underline,
    strike,
  });
}

function alignmentFromStyle(style?: DocumentStyle) {
  switch (style?.textAlign) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

function buildTable(rows: TableCell[][]): DocxTable {
  return new DocxTable({
    rows: rows.map((r) =>
      new DocxTableRow({
        children: r.map((c) =>
          new DocxTableCell({
            children: [new Paragraph({ children: [styleRun(c.text, c.style)] })],
          })
        ),
      })
    ),
    width: { size: 100, type: "pct" },
  });
}

function pxToHalfPoints(px: number): number {
  // 1px ≈ 0.75pt, docx uses half-points => px * 1.5
  return px * 1.5;
}

function lineHeightToTwips(lh?: number): number | undefined {
  // twips = twentieth of a point; approximate if provided in px: convert like font-size
  if (!lh) return undefined;
  const pt = lh * 0.75;
  return Math.round(pt * 20);
}
