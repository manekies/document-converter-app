import type { DocumentStructure } from "../types";
import { tryGetTogetherAIKey, tryGetOpenRouterKey, tryGetHuggingFaceToken } from "../config";

/**
 * Reservoir/fallback LLM caller. Tries Together, then OpenRouter, then Hugging Face Inference API for JSON structure rewriting.
 */
export async function postProcessWithReservoir(
  text: string,
  structure: DocumentStructure,
  language: string
): Promise<{ text: string; structure: DocumentStructure }> {
  const prompt = `
Reconstruct semantic document structure from OCR text and preliminary structure.
Return ONLY valid JSON matching the DocumentStructure interface. No commentary.
Language: ${language}
OCR text:
${text.slice(0, 20000)}

Preliminary structure:
${JSON.stringify(structure).slice(0, 20000)}
`;

  // Together
  const togetherKey = tryGetTogetherAIKey();
  if (togetherKey) {
    const r = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${togetherKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        max_tokens: 4000,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Return only JSON for the DocumentStructure schema." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (r.ok) {
      const j = await r.json() as any;
      const content = j?.choices?.[0]?.message?.content ?? "";
      const refined = JSON.parse(extractJson(content));
      return { text, structure: refined };
    }
  }

  // OpenRouter
  const openRouter = tryGetOpenRouterKey();
  if (openRouter) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouter}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        max_tokens: 4000,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Return only JSON for the DocumentStructure schema." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (r.ok) {
      const j = await r.json() as any;
      const content = j?.choices?.[0]?.message?.content ?? "";
      const refined = JSON.parse(extractJson(content));
      return { text, structure: refined };
    }
  }

  // Hugging Face Inference API (text-generation-inference compatible models)
  const hf = tryGetHuggingFaceToken();
  if (hf) {
    const r = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hf}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Return only JSON for the DocumentStructure schema.\n${prompt}`,
        parameters: { max_new_tokens: 4000, temperature: 0.2, return_full_text: false },
      }),
    });
    if (r.ok) {
      const j = (await r.json()) as any;
      const content = Array.isArray(j) ? j[0]?.generated_text ?? "" : j?.generated_text ?? "";
      const refined = JSON.parse(extractJson(content));
      return { text, structure: refined };
    }
  }

  throw new Error("No reservoir LLM available");
}

function extractJson(s: string): string {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i;
  const m = s.match(fence);
  const raw = m ? m[1] : s;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON found in LLM response");
  return raw.slice(start, end + 1);
}
