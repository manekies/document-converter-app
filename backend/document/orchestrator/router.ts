import { ocrAndStructureFromImage } from "../processors/tesseract";
import { ocrWithOCRSpace } from "../ocr/ocrspace";
import { ocrWithDocTR } from "../ocr/doctr";
import { postProcessWithPrimaryLLM } from "../llm/gemini";
import { postProcessWithGroq } from "../llm/groq";
import { postProcessWithReservoir } from "../llm/reservoir";
import { tryGetDocTRBaseUrl, tryGetOCRSpaceKey, tryGetGoogleAIKey, tryGetGroqKey } from "../config";
import type { DocumentStructure } from "../types";

export type ProcessingMode = "auto" | "local" | "cloud";
export interface OrchestratorOptions {
  mode?: ProcessingMode; // auto by default
  quality?: "fast" | "best"; // best enables LLM semantic structure refinement
}

export interface OrchestratorResult {
  text: string;
  structure: DocumentStructure;
  language: string;
  confidence: number;
  ocrProvider: "tesseract" | "doctr" | "ocrspace";
  llmProvider?: "gemini" | "groq" | "reservoir";
}

// Decide routing based on options and heuristics.
export function decideRoute(
  imageSizeBytes: number,
  opts?: OrchestratorOptions
): { preferLocal: boolean; allowCloud: boolean } {
  const mode = opts?.mode ?? "auto";
  if (mode === "local") return { preferLocal: true, allowCloud: false };
  if (mode === "cloud") return { preferLocal: false, allowCloud: true };
  // auto mode: prefer local for small docs, allow cloud fallback for large/complex
  const complex = imageSizeBytes > 2.5 * 1024 * 1024; // >2.5MB considered complex
  return { preferLocal: !complex, allowCloud: true };
}

// Main orchestration: OCR + optional LLM post-processing with fallback chain.
export async function processWithOrchestrator(
  imageBuffer: Buffer,
  mimeType: string,
  opts?: OrchestratorOptions
): Promise<OrchestratorResult> {
  const { preferLocal, allowCloud } = decideRoute(imageBuffer.byteLength, opts);

  const doctrAvailable = !!tryGetDocTRBaseUrl();
  const ocrspaceAvailable = !!tryGetOCRSpaceKey();

  // Run one or more OCR engines as per routing and do simple ensemble selection.
  const ocrCandidates: Array<Promise<OrchestratorResult>> = [];

  if (preferLocal) {
    // Always include tesseract
    ocrCandidates.push(
      (async () => {
        const r = await ocrAndStructureFromImage(imageBuffer, { lang: "eng" });
        return {
          text: r.text,
          structure: r.structure,
          language: r.language,
          confidence: r.confidence,
          ocrProvider: "tesseract" as const,
        };
      })()
    );
    if (doctrAvailable) {
      ocrCandidates.push(
        (async () => {
          const r = await ocrWithDocTR(imageBuffer, mimeType);
          return {
            text: r.text,
            structure: r.structure,
            language: r.language,
            confidence: r.confidence,
            ocrProvider: "doctr" as const,
          };
        })()
      );
    }
  } else if (allowCloud && ocrspaceAvailable) {
    ocrCandidates.push(
      (async () => {
        const r = await ocrWithOCRSpace(imageBuffer, mimeType);
        return {
          text: r.text,
          structure: r.structure,
          language: r.language,
          confidence: r.confidence,
          ocrProvider: "ocrspace" as const,
        };
      })()
    );
    // Still include local as additional candidate to enable ensemble if fast.
    ocrCandidates.push(
      (async () => {
        const r = await ocrAndStructureFromImage(imageBuffer, { lang: "eng" });
        return {
          text: r.text,
          structure: r.structure,
          language: r.language,
          confidence: r.confidence,
          ocrProvider: "tesseract" as const,
        };
      })()
    );
  } else {
    // Fallback to tesseract
    ocrCandidates.push(
      (async () => {
        const r = await ocrAndStructureFromImage(imageBuffer, { lang: "eng" });
        return {
          text: r.text,
          structure: r.structure,
          language: r.language,
          confidence: r.confidence,
          ocrProvider: "tesseract" as const,
        };
      })()
    );
  }

  const ocrResults = await Promise.allSettled(ocrCandidates);
  const successes = ocrResults
    .filter((r): r is PromiseFulfilledResult<OrchestratorResult> => r.status === "fulfilled")
    .map(r => r.value);

  if (successes.length === 0) {
    // If all failed and cloud is allowed, try cloud once more
    if (allowCloud && ocrspaceAvailable) {
      const r = await ocrWithOCRSpace(imageBuffer, mimeType);
      return {
        text: r.text,
        structure: r.structure,
        language: r.language,
        confidence: r.confidence,
        ocrProvider: "ocrspace",
      };
    }
    // last resort tesseract
    const r = await ocrAndStructureFromImage(imageBuffer, { lang: "eng" });
    return {
      text: r.text,
      structure: r.structure,
      language: r.language,
      confidence: r.confidence,
      ocrProvider: "tesseract",
    };
  }

  // Simple ensemble: pick highest confidence; if close, pick one with more structure richness.
  let best = successes[0];
  for (const cand of successes.slice(1)) {
    const confDiff = cand.confidence - best.confidence;
    if (confDiff > 3) {
      best = cand;
    } else if (Math.abs(confDiff) <= 3) {
      const a = cand.structure.elements.length;
      const b = best.structure.elements.length;
      if (a > b) best = cand;
    }
  }

  // Optional LLM post-processing for semantic reconstruction when quality is "best".
  let llmProvider: OrchestratorResult["llmProvider"];
  if (opts?.quality === "best") {
    const useGemini = !!tryGetGoogleAIKey();
    const useGroq = !!tryGetGroqKey();
    try {
      if (useGemini) {
        const refined = await postProcessWithPrimaryLLM(best.text, best.structure, best.language);
        best = { ...best, text: refined.text, structure: refined.structure };
        llmProvider = "gemini";
      } else if (useGroq) {
        const refined = await postProcessWithGroq(best.text, best.structure, best.language);
        best = { ...best, text: refined.text, structure: refined.structure };
        llmProvider = "groq";
      } else {
        const refined = await postProcessWithReservoir(best.text, best.structure, best.language);
        best = { ...best, text: refined.text, structure: refined.structure };
        llmProvider = "reservoir";
      }
    } catch {
      // Fallback cascade
      try {
        const refined = await postProcessWithGroq(best.text, best.structure, best.language);
        best = { ...best, text: refined.text, structure: refined.structure };
        llmProvider = "groq";
      } catch {
        try {
          const refined = await postProcessWithReservoir(best.text, best.structure, best.language);
          best = { ...best, text: refined.text, structure: refined.structure };
          llmProvider = "reservoir";
        } catch {
          // keep original best
        }
      }
    }
  }

  return { ...best, llmProvider };
}
