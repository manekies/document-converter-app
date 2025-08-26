import { secret } from "encore.dev/config";
import type { AnySecret } from "encore.dev/config";

// Optional OpenAI key for cloud-enhanced processing.
// If unset, processing falls back to fully offline mode automatically.
export const openAIKey = secret("OpenAIKey");

// Returns the OpenAI API key if configured, otherwise null.
// We wrap the accessor in try/catch to avoid throwing when the secret isn't set.
export function tryGetOpenAIKey(): string | null {
  try {
    const val = (openAIKey as AnySecret)();
    if (!val || typeof val !== "string" || val.trim() === "") return null;
    return val;
  } catch {
    return null;
  }
}
