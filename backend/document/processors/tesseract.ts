import Tesseract from "tesseract.js";
import sharp from "sharp";
import type { DocumentElement, DocumentStructure, TableCell, TemplateROI } from "../types";
import { detectPrimaryLanguageISO1 } from "../utils/lang";

// Advanced OCR + layout analysis using Tesseract.js.
// - Multi-language recognition (combined)
// - Paragraph/heading/list detection with geometry
// - Naive multi-column grouping
// - Simple table detection by alignment heuristics
export async function ocrAndStructureFromImage(
  imageBuffer: Buffer,
  opts?: { lang?: string; langs?: string[]; rois?: TemplateROI[] }
): Promise<{ text: string; structure: DocumentStructure; language: string; confidence: number }> {
  // If ROIs are provided, perform targeted OCR and skip layout analysis.
  if (opts?.rois && opts.rois.length > 0) {
    return ocrWithTemplate(imageBuffer, opts.rois, opts);
  }

  const langArg = buildLangArg(opts?.langs, opts?.lang);
  const res = await Tesseract.recognize(imageBuffer, langArg, {
    tessjs_create_hocr: "1",
    tessjs_create_tsv: "1",
  } as any);
  const { text, lines, words } = res.data;

  // Extract image size if available (fallback to default A4-ish in px @72dpi)
  const width = (res?.data as any)?.image?.width ?? 595;
  const height = (res?.data as any)?.image?.height ?? 842;

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

  // Convert raw lines to normalized items with geometry
  type Line = { content: string; x0: number; y0: number; x1: number; y1: number };
  const rawLines: Line[] = [];
  for (const line of (lines as any[]) ?? []) {
    const content = (line?.text ?? "").trim();
    if (!content) continue;
    const bbox = line?.bbox ?? { x0: 50, y0: 50, x1: width - 50, y1: 70 };
    rawLines.push({
      content,
      x0: bbox.x0 ?? 50,
      y0: bbox.y0 ?? 50,
      x1: bbox.x1 ?? width - 50,
      y1: bbox.y1 ?? 70,
    });
  }

  // Multi-column grouping by x0 via k-means-like split on median
  const columns = splitIntoColumns(rawLines);

  // Build elements
  const elements: DocumentElement[] = [];
  for (const col of columns) {
    // Sort by y
    col.sort((a, b) => a.y0 - b.y0);

    // Detect table blocks within column
    const tableBlocks = detectTableBlocks(col);

    let idx = 0;
    while (idx < col.length) {
      const tb = tableBlocks.find(b => b.start <= idx && idx <= b.end);
      if (tb) {
        // Build table from this block
        const rows = buildTableFromLines(col.slice(tb.start, tb.end + 1));
        elements.push({
          type: "table",
          content: "",
          table: { rows },
          position: {
            x: Math.min(...col.slice(tb.start, tb.end + 1).map(l => l.x0)),
            y: col[tb.start].y0,
            width: Math.max(...col.slice(tb.start, tb.end + 1).map(l => l.x1)) - Math.min(...col.slice(tb.start, tb.end + 1).map(l => l.x0)),
            height: col[tb.end].y1 - col[tb.start].y0,
          },
          style: {},
        });
        idx = tb.end + 1;
        continue;
      }

      const l = col[idx];
      const isBullet = /^[•\-\*\u2022]\s+/.test(l.content);
      const isNumbered = /^\d+[\.\)]\s+/.test(l.content);
      if (isBullet || isNumbered) {
        const start = idx;
        let end = idx;
        while (end + 1 < col.length && isListCompatible(col[end + 1].content)) end++;
        const items = col.slice(start, end + 1).map(x => x.content);
        elements.push({
          type: "list",
          content: items.join("\n"),
          position: {
            x: Math.min(...col.slice(start, end + 1).map(r => r.x0)),
            y: col[start].y0,
            width: Math.max(...col.slice(start, end + 1).map(r => r.x1)) - Math.min(...col.slice(start, end + 1).map(r => r.x0)),
            height: col[end].y1 - col[start].y0,
          },
          style: {},
        });
        idx = end + 1;
        continue;
      }

      const isHeading = looksLikeHeading(l.content);
      if (isHeading) {
        elements.push({
          type: "heading",
          content: l.content.replace(/[:：]$/, ""),
          level: headingLevel(l.content),
          position: { x: l.x0, y: l.y0, width: l.x1 - l.x0, height: l.y1 - l.y0 },
          style: { fontWeight: "bold", fontSize: 18, textAlign: "left" },
        });
        idx++;
        continue;
      }

      // Default to paragraph
      elements.push({
        type: "paragraph",
        content: l.content,
        position: { x: l.x0, y: l.y0, width: l.x1 - l.x0, height: l.y1 - l.y0 },
        style: { fontSize: 12, textAlign: "left" },
      });
      idx++;
    }
  }

  // Merge adjacent lists if any
  const merged: DocumentElement[] = [];
  for (const el of elements) {
    const prev = merged[merged.length - 1];
    if (el.type === "list" && prev?.type === "list") {
      prev.content = `${prev.content}\n${el.content}`;
      prev.position.height = Math.max(prev.position.height, el.position.y + el.position.height - prev.position.y);
      continue;
    }
    merged.push(el);
  }

  const structure: DocumentStructure = {
    elements: merged,
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

function buildLangArg(langs?: string[], lang?: string): string {
  if (langs && langs.length > 0) return langs.join("+");
  if (lang) return lang;
  // Default multi-language set for auto-detection scenarios; balances coverage and performance
  return ["eng", "deu", "fra", "spa", "ita", "por", "rus"].join("+");
}

function splitIntoColumns(lines: { x0: number; x1: number }[] & any[]): any[][] {
  if (lines.length < 2) return [lines];
  const xs = lines.map(l => l.x0).sort((a, b) => a - b);
  const median = xs[Math.floor(xs.length / 2)];
  const left = lines.filter(l => l.x0 <= median + 20);
  const right = lines.filter(l => l.x0 > median + 20);
  if (left.length === 0 || right.length === 0) return [lines];
  // Ensure separation: if heavy overlap, treat as single column
  const leftMaxX = Math.max(...left.map(l => l.x1));
  const rightMinX = Math.min(...right.map(l => l.x0));
  if (rightMinX - leftMaxX < 40) return [lines];
  return [left, right];
}

function looksLikeHeading(s: string): boolean {
  const trimmed = s.trim();
  const short = trimmed.length < 60;
  const capsRatio =
    trimmed.length > 0 ? trimmed.replace(/[^A-Z]/g, "").length / trimmed.replace(/[^A-Za-z]/g, "").length : 0;
  return short && (capsRatio > 0.6 || /[:：]$/.test(trimmed));
}

function headingLevel(s: string): number {
  // Use simple heuristics for heading level
  if (/^\d+(\.\d+)*\s+/.test(s)) return 2;
  if (s.length < 30) return 2;
  return 3;
}

function isListCompatible(s: string): boolean {
  return /^[•\-\*\u2022]\s+/.test(s) || /^\d+[\.\)]\s+/.test(s);
}

function detectTableBlocks(col: { content: string; x0: number; x1: number; y0: number; y1: number }[]): { start: number; end: number }[] {
  // Naive heuristic:
  // Lines considered part of table if they have multiple "cells" separated by 2+ spaces or tabs,
  // and x coordinates align across consecutive lines.
  const blocks: { start: number; end: number }[] = [];
  let i = 0;
  while (i < col.length) {
    const parts = splitByGaps(col[i].content);
    if (parts.length >= 3) {
      let start = i;
      let end = i;
      let prevCols = parts.length;
      i++;
      while (i < col.length) {
        const p = splitByGaps(col[i].content);
        if (p.length >= 3 && Math.abs(p.length - prevCols) <= 2) {
          end = i;
          prevCols = p.length;
          i++;
        } else {
          break;
        }
      }
      if (end > start) blocks.push({ start, end });
    } else {
      i++;
    }
  }
  return blocks;
}

function splitByGaps(s: string): string[] {
  // Split by sequences of 2 or more spaces or tabs
  return s.split(/(?:\s{2,}|\t+)/).map(x => x.trim()).filter(Boolean);
}

function buildTableFromLines(lines: { content: string }[]): TableCell[][] {
  const rows: TableCell[][] = [];
  for (const l of lines) {
    const cells = splitByGaps(l.content);
    rows.push(cells.map(text => ({ text, style: {} })));
  }
  return rows;
}

async function ocrWithTemplate(
  imageBuffer: Buffer,
  rois: TemplateROI[],
  opts?: { lang?: string; langs?: string[] }
): Promise<{ text: string; structure: DocumentStructure; language:string; confidence: number }> {
  const langArg = buildLangArg(opts?.langs, opts?.lang);
  const elements: DocumentElement[] = [];
  let combinedText = "";
  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const roi of rois) {
    try {
      // Crop the image to the ROI
      const croppedBuffer = await sharp(imageBuffer)
        .extract({ left: roi.x, top: roi.y, width: roi.width, height: roi.height })
        .toBuffer();

      // Perform OCR on the cropped image
      const res = await Tesseract.recognize(croppedBuffer, langArg);
      const text = res.data.text.trim();

      if (text) {
        combinedText += `${roi.name}: ${text}\n`;
        elements.push({
          type: "paragraph",
          content: text,
          position: { x: roi.x, y: roi.y, width: roi.width, height: roi.height },
          style: { "data-field": roi.name } as any, // Custom style property to hold the field name
        });
        totalConfidence += res.data.confidence;
        confidenceCount++;
      }
    } catch (error) {
      console.error(`Failed to process ROI "${roi.name}":`, error);
    }
  }

  const imageMetadata = await sharp(imageBuffer).metadata();
  const structure: DocumentStructure = {
    elements,
    metadata: {
      pageCount: 1,
      orientation: (imageMetadata.height ?? 842) >= (imageMetadata.width ?? 595) ? "portrait" : "landscape",
      dimensions: { width: imageMetadata.width ?? 595, height: imageMetadata.height ?? 842 },
      template: "custom", // Indicate that a template was used
    },
  };

  const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
  const detectedLanguage = detectPrimaryLanguageISO1(combinedText) ?? "en";

  return {
    text: combinedText.trim(),
    structure,
    language: detectedLanguage,
    confidence: avgConfidence,
  };
}
