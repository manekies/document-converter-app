import Tesseract from "tesseract.js";
import type { DocumentElement, DocumentStructure } from "../types";
import { detectPrimaryLanguageISO1 } from "../utils/lang";

// Performs offline OCR using Tesseract.js and builds a reasonable structure.
export async function ocrAndStructureFromImage(
  imageBuffer: Buffer,
  opts?: { lang?: string; langs?: string[] }
): Promise<{ text: string; structure: DocumentStructure; language: string; confidence: number }> {
  const langArg = opts?.langs && opts.langs.length > 0 ? opts.langs.join("+") : (opts?.lang ?? "eng");
  const res = await Tesseract.recognize(imageBuffer, langArg);
  const { text, lines, words } = res.data;

  // Extract image size if available (fallback to default A4-ish in px @72dpi)
  const width = (res?.data as any)?.image?.width ?? 595;
  const height = (res?.data as any)?.image?.height ?? 842;

  const elements: DocumentElement[] = [];

  // Compute average confidence
  let avgConf = 0;
  let confCount = 0;
  for (const w of words ?? []) {
    if (typeof (w as any).confidence === "number") {
      avgConf += (w as any).confidence;
      confCount++;
    }
  }
  const confidence = confCount > 0 ? avgConf / confCount : 0;

  // Simple heuristic: treat each line as a paragraph, detect headings and lists.
  for (const line of (lines as any[]) ?? []) {
    const content = (line?.text ?? "").trim();
    if (!content) continue;

    const bbox = line?.bbox ?? { x0: 50, y0: 50, x1: width - 50, y1: 70 };
    const pos = {
      x: bbox.x0 ?? 50,
      y: bbox.y0 ?? 50,
      width: Math.max(10, (bbox.x1 ?? width - 50) - (bbox.x0 ?? 50)),
      height: Math.max(10, (bbox.y1 ?? 70) - (bbox.y0 ?? 50)),
    };

    // Detect list items
    const isBullet = /^[•\-\*\u2022]\s+/.test(content);
    const isNumbered = /^\d+[\.\)]\s+/.test(content);
    if (isBullet || isNumbered) {
      elements.push({
        type: "list",
        content,
        position: pos,
        style: {},
      });
      continue;
    }

    // Detect likely headings: short length and lots of caps or ending colon
    const isShort = content.length < 60;
    const capsRatio =
      content.length > 0
        ? content.replace(/[^A-Z]/g, "").length / content.replace(/[^A-Za-z]/g, "").length
        : 0;
    const looksHeading = isShort && (capsRatio > 0.6 || /[:：]$/.test(content));
    if (looksHeading) {
      elements.push({
        type: "heading",
        content: content.replace(/[:：]$/, ""),
        position: pos,
        style: { fontWeight: "bold", fontSize: 18, textAlign: "left" },
        level: content.length < 30 ? 2 : 3,
      });
      continue;
    }

    // Default to paragraph
    elements.push({
      type: "paragraph",
      content,
      position: pos,
      style: { fontSize: 12, textAlign: "left" },
    });
  }

  // Merge adjacent list items into a single list element content by proximity.
  const mergedElements: DocumentElement[] = [];
  for (const el of elements) {
    const prev = mergedElements[mergedElements.length - 1];
    if (el.type === "list" && prev?.type === "list") {
      prev.content = `${prev.content}\n${el.content}`;
      prev.position.height = Math.max(prev.position.height, el.position.y + el.position.height - prev.position.y);
      continue;
    }
    mergedElements.push(el);
  }

  const structure: DocumentStructure = {
    elements: mergedElements,
    metadata: {
      pageCount: 1,
      orientation: height >= width ? "portrait" : "landscape",
      dimensions: { width, height },
    },
  };

  // Language detection using statistically inferred guess
  const detected = detectPrimaryLanguageISO1((text ?? "").trim()) ?? "en";
  return { text: (text ?? "").trim(), structure, language: detected, confidence };
}
