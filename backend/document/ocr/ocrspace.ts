import { tryGetOCRSpaceKey } from "../config";
import type { DocumentStructure } from "../types";

// Minimal OCR.Space integration for prototyping / high free-quota operations.
// Note: Use only for non-sensitive data.
export async function ocrWithOCRSpace(
  imageBuffer: Buffer,
  mimeType: string,
  languages?: string[]
): Promise<{ text: string; structure: DocumentStructure; language: string; confidence: number }> {
  const apiKey = tryGetOCRSpaceKey();
  if (!apiKey) {
    throw new Error("OCR.Space API key not configured");
  }

  const langCode = (languages?.[0] ?? "eng").toLowerCase();

  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType || "application/octet-stream" });
  form.append("file", blob, "image");
  form.append("OCREngine", "2");
  form.append("scale", "true");
  form.append("isTable", "true");
  form.append("detectOrientation", "true");
  form.append("language", langCode);

  const resp = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      apikey: apiKey,
    },
    body: form,
  });

  if (!resp.ok) {
    throw new Error(`OCR.Space request failed with status ${resp.status}`);
  }
  const json = await resp.json() as any;

  if (json.OCRExitCode !== 1) {
    const err = json.ErrorMessage || json.ErrorDetails || "OCR.Space error";
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }

  const parsed = json.ParsedResults?.[0];
  const text = parsed?.ParsedText ?? "";
  const meanConf = parsed?.MeanConfidence ?? 0;

  // Build a naive structure by splitting on lines.
  const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l);
  const elements = lines.map((l: string) => {
    const isList = /^[•\-\*\u2022]\s+/.test(l) || /^\d+[\.\)]\s+/.test(l);
    const isHeading = l.length < 60 && (/[A-Z]{3,}/.test(l) || /[:：]$/.test(l));
    return isList
      ? { type: "list", content: l, position: { x: 50, y: 50, width: 500, height: 14 }, style: {} }
      : isHeading
      ? {
          type: "heading",
          content: l.replace(/[:：]$/, ""),
          level: 2,
          position: { x: 50, y: 50, width: 500, height: 20 },
          style: { fontWeight: "bold", fontSize: 18 },
        }
      : { type: "paragraph", content: l, position: { x: 50, y: 50, width: 500, height: 14 }, style: { fontSize: 12 } };
  });

  const structure: DocumentStructure = {
    elements,
    metadata: { pageCount: 1, orientation: "portrait", dimensions: { width: 595, height: 842 } },
  };

  return { text, structure, language: mapOCRSpaceLang(langCode), confidence: typeof meanConf === "number" ? meanConf : 0 };
}

function mapOCRSpaceLang(code: string): string {
  const map: Record<string, string> = {
    eng: "en",
    rus: "ru",
    deu: "de",
    ger: "de",
    fra: "fr",
    fre: "fr",
    spa: "es",
    ita: "it",
    por: "pt",
    jpn: "ja",
    chi_sim: "zh",
    ara: "ar",
  };
  return map[code] ?? "en";
}
