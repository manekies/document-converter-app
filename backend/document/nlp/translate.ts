import { api, APIError } from "encore.dev/api";
import type { TranslateRequest, TranslateResponse } from "../types";
import { tryGetGoogleAIKey, tryGetOpenAIKey } from "../config";

// Translates text to the target language, preserving formatting as best-effort.
export const translate = api<TranslateRequest, TranslateResponse>(
  { expose: true, method: "POST", path: "/nlp/translate" },
  async (req) => {
    if (!req.text || req.text.trim() === "") {
      throw APIError.invalidArgument("text is required");
    }
    if (!req.targetLanguage) {
      throw APIError.invalidArgument("targetLanguage is required");
    }

    const gKey = tryGetGoogleAIKey();
    const oKey = tryGetOpenAIKey();

    const sys = "You are a translation engine. Return only the translated text, no explanations.";
    const user = `Translate the following text to ${req.targetLanguage}.
${req.sourceLanguage ? `Source language: ${req.sourceLanguage}` : "Detect the source language automatically."}
Text:
${req.text}`;

    if (gKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(gKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro" });
        const result = await model.generateContent([{ text: `${sys}\n\n${user}` }]);
        const content = result.response?.candidates?.[0]?.content?.parts?.[0]?.text
          ?? result.response?.text()
          ?? "";
        return { translatedText: content.trim(), detectedSourceLanguage: req.sourceLanguage };
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
              { role: "system", content: sys },
              { role: "user", content: user },
            ],
            temperature: 0.2,
          }),
        });
        if (!r.ok) throw new Error(await r.text());
        const j = await r.json() as any;
        const content = j?.choices?.[0]?.message?.content ?? "";
        return { translatedText: content.trim(), detectedSourceLanguage: req.sourceLanguage };
      } catch (err) {
        throw APIError.unavailable("translation provider failed", err as Error);
      }
    }

    throw APIError.unimplemented("no translation provider configured");
  }
);
