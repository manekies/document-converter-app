import type { DocumentStructure } from "../types";
import { processWithOrchestrator, type OrchestratorOptions } from "../orchestrator/router";

// Performs OCR and structure detection using the orchestration layer.
// If cloud providers are configured, it may augment using LLM post-processing for better structure.
export async function processImageToStructure(
  imageBuffer: Buffer,
  mimeType: string,
  options?: OrchestratorOptions
): Promise<{ text: string; structure: DocumentStructure; language: string; confidence: number; ocrProvider: string; llmProvider?: string }> {
  const res = await processWithOrchestrator(imageBuffer, mimeType, options);
  return {
    text: res.text,
    structure: res.structure,
    language: res.language,
    confidence: res.confidence,
    ocrProvider: res.ocrProvider,
    llmProvider: res.llmProvider,
  };
}
