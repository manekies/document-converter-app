import { documentDB } from "../db";
import type { TemplateStyles } from "../types";

const DEFAULT_TEMPLATES: Record<string, TemplateStyles> = {
  modern: {
    name: "modern",
    page: { marginTop: 50, marginRight: 50, marginBottom: 50, marginLeft: 50, backgroundColor: "#ffffff" },
    fonts: { fontFamily: "Noto Sans", headingFontFamily: "Noto Sans", monoFontFamily: "JetBrains Mono" },
    headings: {
      h1: { fontSize: 28, fontWeight: "bold", color: "#111827" },
      h2: { fontSize: 22, fontWeight: "bold", color: "#111827" },
      h3: { fontSize: 18, fontWeight: "bold", color: "#111827" },
    },
    paragraph: { fontSize: 12, color: "#111827" },
    list: { fontSize: 12, color: "#111827" },
    table: { borderColor: "#e5e7eb", headerBackground: "#f3f4f6" },
  },
  classic: {
    name: "classic",
    page: { marginTop: 72, marginRight: 72, marginBottom: 72, marginLeft: 72, backgroundColor: "#ffffff" },
    fonts: { fontFamily: "Times New Roman", headingFontFamily: "Times New Roman", monoFontFamily: "Courier New" },
    headings: {
      h1: { fontSize: 24, fontWeight: "bold" },
      h2: { fontSize: 18, fontWeight: "bold" },
      h3: { fontSize: 14, fontWeight: "bold" },
    },
    paragraph: { fontSize: 12 },
    list: { fontSize: 12 },
    table: { borderColor: "#d1d5db", headerBackground: "#f9fafb" },
  },
  compact: {
    name: "compact",
    page: { marginTop: 36, marginRight: 36, marginBottom: 36, marginLeft: 36, backgroundColor: "#ffffff" },
    fonts: { fontFamily: "Inter", headingFontFamily: "Inter", monoFontFamily: "JetBrains Mono" },
    headings: {
      h1: { fontSize: 24, fontWeight: "bold" },
      h2: { fontSize: 20, fontWeight: "bold" },
      h3: { fontSize: 16, fontWeight: "bold" },
    },
    paragraph: { fontSize: 11 },
    list: { fontSize: 11 },
    table: { borderColor: "#e5e7eb", headerBackground: "#ffffff" },
  },
};

export async function loadTemplate(name?: string): Promise<TemplateStyles> {
  const key = (name ?? "modern").toLowerCase();
  // Try DB first
  try {
    const row = await documentDB.queryRow<{ data: any }>`
      SELECT data FROM export_templates WHERE LOWER(name) = ${key} LIMIT 1
    `;
    if (row?.data) {
      return row.data as TemplateStyles;
    }
  } catch {
    // ignore DB errors
  }
  return DEFAULT_TEMPLATES[key] ?? DEFAULT_TEMPLATES["modern"];
}

export function cssFromTemplate(t: TemplateStyles): string {
  const bodyFont = t.fonts?.fontFamily ?? "system-ui, Arial, sans-serif";
  const baseColor = "#111827";
  const p = t.paragraph ?? {};
  const list = t.list ?? {};
  const table = t.table ?? {};
  return `
    body { font-family: ${quoteIfNeeded(bodyFont)}; margin: 40px; line-height: 1.6; color: ${p.color ?? baseColor}; }
    h1 { ${styleToCss(t.headings?.h1)} }
    h2 { ${styleToCss(t.headings?.h2)} }
    h3 { ${styleToCss(t.headings?.h3)} }
    h4 { ${styleToCss(t.headings?.h4)} }
    h5 { ${styleToCss(t.headings?.h5)} }
    h6 { ${styleToCss(t.headings?.h6)} }
    p { ${styleToCss(p)} }
    ul { margin: 0.8em 0 0.8em 1.5em; ${styleToCss(list)} }
    li { margin: 0.3em 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.8em 0; }
    th, td { border: 1px solid ${table.borderColor ?? "#e5e7eb"}; padding: 6px 8px; text-align: left; vertical-align: top; }
  `;
}

function styleToCss(s?: Partial<{ fontSize?: number; fontWeight?: "normal" | "bold"; color?: string; fontStyle?: "normal" | "italic" }>): string {
  if (!s) return "";
  const parts: string[] = [];
  if (s.fontSize) parts.push(`font-size:${s.fontSize}px`);
  if (s.fontWeight) parts.push(`font-weight:${s.fontWeight === "bold" ? 700 : 400}`);
  if (s.color) parts.push(`color:${s.color}`);
  if (s.fontStyle) parts.push(`font-style:${s.fontStyle}`);
  return parts.join(";");
}

function quoteIfNeeded(font: string): string {
  return /[ \t]/.test(font) ? `"${font}"` : font;
}
