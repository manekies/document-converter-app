import type { DocumentStructure } from "../types";
import { tryGetGroqKey } from "../config";

// Import groq sdk if available
let Groq: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Groq = require("groq-sdk").Groq;
} catch {
  Groq = null;
}

export async function postProcessWithGroq(
  text: string,
  structure: DocumentStructure,
  language: string
): Promise<{ text: string; structure: DocumentStructure }> {
  const key = tryGetGroqKey();
  if (!key || !Groq) throw new Error("Groq not available");
  const client = new Groq({ apiKey: key });

  const prompt = `
You are given OCR text and a preliminary structure of a document. 
Clean artifacts and reconstruct a semantic editable structure.
Return ONLY JSON matching the provided DocumentStructure interface. No extra text.
Language: ${language}
OCR text:
${text.slice(0, 24000)}

Preliminary structure:
${JSON.stringify(structure).slice(0, 24000)}
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      { role: "system", content: "Return only valid JSON for the DocumentStructure schema." },
      { role: "user", content: prompt },
    ],
  });

  const content =
    completion.choices?.[0]?.message?.content ??
    "";
  const jsonStr = extractJson(content);
  const refined: DocumentStructure = JSON.parse(jsonStr);
  return { text, structure: refined };
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
