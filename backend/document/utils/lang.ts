import { francAll } from "franc";

// Minimal 3->1 ISO language map for common languages
const iso3to1: Record<string, string> = {
  eng: "en",
  rus: "ru",
  deu: "de",
  ger: "de",
  fra: "fr",
  fre: "fr",
  spa: "es",
  ita: "it",
  por: "pt",
  nld: "nl",
  ara: "ar",
  heb: "he",
  jpn: "ja",
  kor: "ko",
  zho: "zh",
  cmn: "zh",
  hin: "hi",
  ben: "bn",
  ukr: "uk",
  pol: "pl",
  ces: "cs",
  slk: "sk",
  swe: "sv",
  nor: "no",
  dan: "da",
  fin: "fi",
  tur: "tr",
  ell: "el",
  vie: "vi",
};

export function detectPrimaryLanguageISO1(text: string): string | null {
  try {
    const ranked = francAll(text, { minLength: 20 });
    for (const [code3] of ranked) {
      const code1 = iso3to1[code3];
      if (code1) return code1;
    }
  } catch {
    // ignore
  }
  return null;
}
