import { tryGetDocTRAuthToken, tryGetDocTRBaseUrl } from "../config";
import type { DocumentStructure } from "../types";

// docTR self-hosted OCR integration.
// Expects an HTTP endpoint that accepts multipart upload and returns:
// { text: string; structure: DocumentStructure; language: string; confidence: number }
export async function ocrWithDocTR(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; structure: DocumentStructure; language: string; confidence: number }> {
  const base = tryGetDocTRBaseUrl();
  if (!base) throw new Error("docTR endpoint not configured");
  const token = tryGetDocTRAuthToken();

  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType || "application/octet-stream" });
  form.append("file", blob, "image");

  const resp = await fetch(`${base.replace(/\/$/, "")}/ocr`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!resp.ok) {
    throw new Error(`docTR request failed with status ${resp.status}`);
  }
  const json = await resp.json() as any;

  if (!json || typeof json.text !== "string" || !json.structure) {
    throw new Error("docTR response malformed");
  }

  const structure: DocumentStructure = json.structure;
  const language = typeof json.language === "string" ? json.language : "en";
  const confidence = typeof json.confidence === "number" ? json.confidence : 0;

  return { text: json.text, structure, language, confidence };
}
