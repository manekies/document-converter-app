import { fontsBucket } from "../storage";

export interface PdfFontSet {
  regular?: Buffer;
  bold?: Buffer;
  italic?: Buffer;
  boldItalic?: Buffer;
}

export async function loadFonts(preferredFamily?: string): Promise<PdfFontSet> {
  // Attempt to load common font variants from fonts bucket.
  // Naming convention: <Family>-Regular.ttf, <Family>-Bold.ttf, <Family>-Italic.ttf, <Family>-BoldItalic.ttf
  const families = preferredFamily ? [preferredFamily] : ["NotoSans", "Noto Sans", "Inter"];
  for (const fam of families) {
    const safe = fam.replace(/\s+/g, "");
    const variants = [
      { name: `${safe}-Regular.ttf`, key: "regular" as const },
      { name: `${safe}-Bold.ttf`, key: "bold" as const },
      { name: `${safe}-Italic.ttf`, key: "italic" as const },
      { name: `${safe}-BoldItalic.ttf`, key: "boldItalic" as const },
    ];
    const out: PdfFontSet = {};
    let found = 0;
    for (const v of variants) {
      const path = `pdf/${v.name}`;
      try {
        const exists = await fontsBucket.exists(path);
        if (exists) {
          const buf = await fontsBucket.download(path);
          out[v.key] = buf;
          found++;
        }
      } catch {
        // ignore
      }
    }
    if (found > 0) return out;
  }
  return {};
}
