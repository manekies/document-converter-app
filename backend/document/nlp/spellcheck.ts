import { api, APIError } from "encore.dev/api";
import type { SpellcheckRequest, SpellcheckResponse } from "../types";
import { tryGetGoogleAIKey, tryGetOpenAIKey } from "../config";

// Performs spellchecking and light grammar correction in the specified language (or autodetected).
export const spellcheck = api<SpellcheckRequest, SpellcheckResponse>(
  { expose: true, method: "POST", path: "/nlp/spellcheck" },
  async (req) => {
    if (!req.text || req.text.trim() === "") {
      throw APIError.invalidArgument("text is required");
    }

    const language = req.language ?? "auto";
    const gKey = tryGetGoogleAIKey();
    const oKey = tryGetOpenAIKey();

    const prompt = `You are a spellchecker and grammar corrector.
Language: ${language}.
Correct the following text with minimal edits, preserving meaning and style.
Return ONLY the corrected text, no explanations.

Text:
${req.text}`;

    // Prefer Gemini if configured
    if (gKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(gKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent([{ text: prompt }]);
        const content = result.response?.candidates?.[0]?.content?.parts?.[0]?.text
          ?? result.response?.text()
          ?? "";
        return { correctedText: content.trim() };
      } catch (err) {
        // fall through
      }
    }

    if (oKey) {
      try {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${oKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You return only corrected text. No explanations." },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
          }),
        });
        if (!r.ok) throw new Error(await r.text());
        const j = await r.json() as any;
        const content = j?.choices?.[0]?.message?.content ?? "";
        return { correctedText: content.trim() };
      } catch (err) {
        throw APIError.unavailable("spellcheck provider failed", err as Error);
      }
    }

    throw APIError.unimplemented("no NLP provider configured");
  }
);
