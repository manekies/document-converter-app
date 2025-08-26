import { ocrAndStructureFromImage } from "./tesseract";
import { tryGetOpenAIKey } from "../config";
import type { DocumentStructure } from "../types";

// Placeholder for future cloud-augmented structuring.
// Currently returns the offline OCR result. If an OpenAI key is present we could
// enhance structure in the future without changing the API surface.
export async function processImageToStructure(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; structure: DocumentStructure; language: string }> {
  // Always perform offline OCR for privacy and reliability.
  const offline = await ocrAndStructureFromImage(imageBuffer, { lang: "eng" });

  // If cloud key exists, we could post-process to improve structure. For now we return offline result
  // to ensure predictable behavior and privacy by default.
  const maybeKey = tryGetOpenAIKey();
  if (!maybeKey) {
    return offline;
  }

  // Future enhancement hook for cloud post-processing; return offline for now.
  return offline;
}
