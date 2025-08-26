import type { DocumentStructure, DocumentElement } from "../types";

type AssetLoader = (src: string) => Promise<Buffer | null>;

export async function generateHTML(
  structure: DocumentStructure,
  mode: "exact" | "editable",
  assetLoader?: AssetLoader
): Promise<string> {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 40px; line-height: 1.6; color: #111827; }
    h1, h2, h3, h4, h5, h6 { margin: 1.2em 0 0.6em; }
    p { margin: 0.8em 0; }
    ul { margin: 0.8em 0 0.8em 1.5em; }
    li { margin: 0.3em 0; }
    .page { position: relative; }
    .abs { position: absolute; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; margin: 0.8em 0; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
    img { max-width: 100%; }
  </style>
</head>
<body>
`;

  if (mode === "exact") {
    const { width, height } = structure.metadata.dimensions;
    html += `<div class="page" style="width:${width}px;height:${height}px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">`;
    for (const element of structure.elements) {
      html += await renderExactElement(element, assetLoader);
    }
    html += `</div>`;
  } else {
    for (const element of structure.elements) {
      html += await renderFlowElement(element, assetLoader);
    }
  }

  html += "\n</body>\n</html>";
  return html;
}

async function renderExactElement(element: DocumentElement, assetLoader?: AssetLoader): Promise<string> {
  const x = element.position.x;
  const y = element.position.y;
  const w = element.position.width;
  const style = `left:${x}px;top:${y}px;width:${w}px;`;
  const extra = styleFrom(element);

  if (element.type === "list") {
    const listItems = element.content.split("\n").filter(i => i.trim());
    let s = `<ul class="abs" style="${style}${extra}">`;
    for (const item of listItems) {
      const clean = item.replace(/^[•\-\*\u2022]\s*/, "");
      s += `<li>${escapeHtml(clean)}</li>`;
    }
    s += `</ul>`;
    return s;
  } else if (element.type === "heading") {
    const level = Math.min(element.level || 2, 6);
    return `<h${level} class="abs" style="${style}${extra}">${escapeHtml(element.content)}</h${level}>`;
  } else if (element.type === "table" && element.table) {
    return `<div class="abs" style="${style}">${renderTable(element)}</div>`;
  } else if (element.type === "image" && element.imageSrc) {
    const dataUri = await tryGetDataUri(element.imageSrc, assetLoader);
    const wpx = element.imageWidth ?? element.position.width;
    const hpx = element.imageHeight ?? element.position.height;
    const size = `width:${wpx}px;height:${hpx}px;`;
    return `<img class="abs" style="${style}${size}" src="${dataUri ?? element.imageSrc}" alt="${escapeHtml(element.content)}" />`;
  } else {
    return `<div class="abs" style="${style}${extra}">${escapeHtml(element.content)}</div>`;
  }
}

async function renderFlowElement(element: DocumentElement, assetLoader?: AssetLoader): Promise<string> {
  switch (element.type) {
    case "heading": {
      const level = Math.min(element.level || 2, 6);
      return `<h${level} style="${styleFrom(element)}">${escapeHtml(element.content)}</h${level}>\n`;
    }
    case "list": {
      let s = `<ul style="${styleFrom(element)}">\n`;
      const listItems = element.content.split("\n").filter(item => item.trim());
      for (const item of listItems) {
        const cleanItem = item.replace(/^[•\-\*\u2022]\s*/, "");
        s += `<li>${escapeHtml(cleanItem)}</li>\n`;
      }
      s += "</ul>\n";
      return s;
    }
    case "table":
      if (element.table) {
        return renderTable(element);
      }
      return `<p>${escapeHtml(element.content)}</p>\n`;
    case "image":
      if (element.imageSrc) {
        const dataUri = await tryGetDataUri(element.imageSrc, assetLoader);
        const wpx = element.imageWidth ?? element.position.width;
        const hpx = element.imageHeight ?? element.position.height;
        return `<img src="${dataUri ?? element.imageSrc}" alt="${escapeHtml(element.content)}" style="width:${wpx}px;height:${hpx}px;" />\n`;
      }
      return `<p>${escapeHtml(element.content)}</p>\n`;
    default:
      return `<p style="${styleFrom(element)}">${escapeHtml(element.content)}</p>\n`;
  }
}

function renderTable(element: DocumentElement): string {
  const rows = element.table?.rows ?? [];
  let s = `<table>\n<tbody>\n`;
  for (const row of rows) {
    s += `<tr>`;
    for (const cell of row) {
      const style = inlineStyleFrom(cell.style);
      s += `<td style="${style}">${escapeHtml(cell.text)}</td>`;
    }
    s += `</tr>\n`;
  }
  s += `</tbody>\n</table>\n`;
  return s;
}

function styleFrom(el: DocumentElement): string {
  const fontStyle = el.style?.fontStyle === "italic" ? "font-style:italic;" : "";
  const fontWeight = el.style?.fontWeight === "bold" ? "font-weight:700;" : "";
  const fontSize = el.style?.fontSize ? `font-size:${el.style.fontSize}px;` : "";
  const textAlign = el.style?.textAlign ? `text-align:${el.style.textAlign};` : "";
  const color = el.style?.color ? `color:${el.style.color};` : "";
  const bg = el.style?.backgroundColor ? `background-color:${el.style.backgroundColor};` : "";
  const fontFamily = el.style?.fontFamily ? `font-family:${el.style.fontFamily};` : "";
  const decoration = el.style?.textDecoration ? `text-decoration:${el.style.textDecoration};` : "";
  const lineHeight = el.style?.lineHeight ? `line-height:${el.style.lineHeight}px;` : "";
  return `${fontStyle}${fontWeight}${fontSize}${textAlign}${color}${bg}${fontFamily}${decoration}${lineHeight}`;
}

function inlineStyleFrom(style?: DocumentElement["style"]): string {
  if (!style) return "";
  const parts: string[] = [];
  if (style.fontFamily) parts.push(`font-family:${style.fontFamily}`);
  if (style.fontSize) parts.push(`font-size:${style.fontSize}px`);
  if (style.fontWeight === "bold") parts.push(`font-weight:700`);
  if (style.fontStyle === "italic") parts.push(`font-style:italic`);
  if (style.textAlign) parts.push(`text-align:${style.textAlign}`);
  if (style.color) parts.push(`color:${style.color}`);
  if (style.backgroundColor) parts.push(`background-color:${style.backgroundColor}`);
  if (style.textDecoration) parts.push(`text-decoration:${style.textDecoration}`);
  if (style.lineHeight) parts.push(`line-height:${style.lineHeight}px`);
  return parts.join(";");
}

async function tryGetDataUri(src: string, assetLoader?: AssetLoader): Promise<string | null> {
  if (!assetLoader) return null;
  try {
    const buf = await assetLoader(src);
    if (!buf) return null;
    const ext = src.split(".").pop()?.toLowerCase() ?? "png";
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
