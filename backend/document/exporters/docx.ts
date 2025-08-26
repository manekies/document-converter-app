import { Document as DocxDocument, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { DocumentElement, DocumentStructure } from "../types";

export async function generateDocx(structure: DocumentStructure, mode: "exact" | "editable"): Promise<Buffer> {
  const paragraphs: Paragraph[] = [];

  if (mode === "exact") {
    // In "exact" mode we still map to paragraphs but keep heading weights and approximate spacing.
    for (const el of structure.elements) {
      paragraphs.push(elementToParagraph(el, true));
    }
  } else {
    for (const el of structure.elements) {
      paragraphs.push(elementToParagraph(el, false));
    }
  }

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

function elementToParagraph(el: DocumentElement, exact: boolean): Paragraph {
  const size = el.style?.fontSize ? Math.round(el.style.fontSize * 2) : undefined; // docx uses half-points
  if (el.type === "heading") {
    const level = Math.min(el.level || 2, 6);
    return new Paragraph({
      text: el.content,
      heading:
        level === 1
          ? HeadingLevel.HEADING_1
          : level === 2
          ? HeadingLevel.HEADING_2
          : level === 3
          ? HeadingLevel.HEADING_3
          : level === 4
          ? HeadingLevel.HEADING_4
          : level === 5
          ? HeadingLevel.HEADING_5
          : HeadingLevel.HEADING_6,
    });
  }

  if (el.type === "list") {
    const items = el.content.split("\n").filter(i => i.trim());
    const paras = items.map(
      i =>
        new Paragraph({
          text: i.replace(/^[•\-\*\u2022]\s*/, ""),
          bullet: { level: 0 },
        })
    );
    // Return a concatenated paragraph by chaining runs; we will flatten in caller by pushing each separately if needed.
    // But for simple implementation, return a single paragraph with joined bullet items separated by line breaks.
    return new Paragraph({
      children: items.map((i, idx) => {
        const clean = i.replace(/^[•\-\*\u2022]\s*/, "");
        return new TextRun({
          text: (idx > 0 ? "\n• " : "• ") + clean,
          break: idx > 0,
        });
      }),
    });
  }

  // Paragraph / default
  return new Paragraph({
    children: [
      new TextRun({
        text: el.content,
        bold: el.style?.fontWeight === "bold",
        italics: el.style?.fontStyle === "italic",
        size,
      }),
    ],
  });
}
