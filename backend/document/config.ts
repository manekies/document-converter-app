import { secret } from "encore.dev/config";
import type { AnySecret } from "encore.dev/config";

// Optional OpenAI key for cloud-enhanced processing.
// If unset, processing falls back to fully offline mode automatically.
export const openAIKey = secret("OpenAIKey");

// Primary LLM (Google AI Studio - Gemini)
export const googleAIKey = secret("GoogleAIKey");

// High-throughput/streaming LLM (Groq)
export const groqKey = secret("GroqKey");

// OCR.Space for cloud OCR (non-sensitive, prototyping)
export const ocrSpaceKey = secret("OCRSpaceKey");

// Reservoir/fallback LLM providers
export const togetherAIKey = secret("TogetherAIKey");
export const openRouterKey = secret("OpenRouterKey");
export const huggingFaceToken = secret("HuggingFaceToken");

// Self-hosted docTR endpoint (optional). If set, orchestrator can use it for local secure OCR.
// Provide the base URL, e.g. "http://doctr:8000"
export const docTRBaseUrl = secret("DocTREndpoint");
export const docTRAuthToken = secret("DocTRToken");

// Returns the secret value if configured, otherwise null.
export function tryGetSecret(s: AnySecret): string | null {
  try {
    const val = s();
    if (!val || typeof val !== "string" || val.trim() === "") return null;
    return val;
  } catch {
    return null;
  }
}

// Returns the OpenAI API key if configured, otherwise null.
export function tryGetOpenAIKey(): string | null {
  return tryGetSecret(openAIKey as AnySecret);
}

export function tryGetGoogleAIKey(): string | null {
  return tryGetSecret(googleAIKey as AnySecret);
}

export function tryGetGroqKey(): string | null {
  return tryGetSecret(groqKey as AnySecret);
}

export function tryGetOCRSpaceKey(): string | null {
  return tryGetSecret(ocrSpaceKey as AnySecret);
}

export function tryGetTogetherAIKey(): string | null {
  return tryGetSecret(togetherAIKey as AnySecret);
}

export function tryGetOpenRouterKey(): string | null {
  return tryGetSecret(openRouterKey as AnySecret);
}

export function tryGetHuggingFaceToken(): string | null {
  return tryGetSecret(huggingFaceToken as AnySecret);
}

export function tryGetDocTRBaseUrl(): string | null {
  return tryGetSecret(docTRBaseUrl as AnySecret);
}

export function tryGetDocTRAuthToken(): string | null {
  return tryGetSecret(docTRAuthToken as AnySecret);
}
