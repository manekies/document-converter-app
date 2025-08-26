import type { DocumentStructure } from "../types";
import { tryGetGoogleAIKey } from "../config";

// Optional: import only if configured to avoid accidental crashes in environments without the package.
let GoogleGenerativeAI: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
} catch {
  GoogleGenerativeAI = null;
}

export async function postProcessWithPrimaryLLM(
  text: string,
  structure: DocumentStructure,
  language: string
): Promise<{ text: string; structure: DocumentStructure }> {
  const key = tryGetGoogleAIKey();
  if (!key || !GoogleGenerativeAI) {
    throw new Error("Primary LLM not available");
  }
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `
You are given OCR text and a preliminary structure of a document. 
Your task:
1) Clean post-OCR artifacts.
2) Reconstruct a semantic, editable document layout with headings, lists, and paragraphs.
3) Output STRICTLY a JSON object with the following TypeScript interface:

interface DocumentStructure {
  elements: {
    type: "heading" | "paragraph" | "table" | "list" | "image" | "formula";
    content: string;
    position: { x: number; y: number; width: number; height: number };
    style: {
      fontSize?: number;
      fontWeight?: "normal" | "bold";
      fontStyle?: "normal" | "italic";
      textAlign?: "left" | "center" | "right" | "justify";
      color?: string;
      backgroundColor?: string;
    };
    level?: number;
  }[];
  metadata: {
    pageCount: number;
    orientation: "portrait" | "landscape";
    dimensions: { width: number; height: number };
  };
}

Preserve language: ${language}.
Ensure valid JSON with no comments.
OCR text:
${text.slice(0, 18000)}

Preliminary structure JSON:
${JSON.stringify(structure).slice(0, 18000)}
`;

  const result = await model.generateContent([{ text: prompt }]);
  const content = result.response?.candidates?.[0]?.content?.parts?.[0]?.text
    ?? result.response?.text()
    ?? "";

  const jsonStr = extractJson(content);
  const refined: DocumentStructure = JSON.parse(jsonStr);
  return { text, structure: refined };
}

function extractJson(s: string): string {
  // Remove markdown fences if present
  const fence = /```(?:json)?\s*([\s\S]*?)```/i;
  const m = s.match(fence);
  const raw = m ? m[1] : s;
  // Try to find first { ... } block
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON found in LLM response");
  return raw.slice(start, end + 1);
}
