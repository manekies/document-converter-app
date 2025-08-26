import type { DocumentStructure } from "../types";

export function generateHTML(structure: DocumentStructure, mode: "exact" | "editable"): string {
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
  </style>
</head>
<body>
`;

  if (mode === "exact") {
    const { width, height } = structure.metadata.dimensions;
    html += `<div class="page" style="width:${width}px;height:${height}px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">`;
    for (const element of structure.elements) {
      const x = element.position.x;
      const y = element.position.y;
      const w = element.position.width;
      const style = `left:${x}px;top:${y}px;width:${w}px;`;
      const fontStyle = element.style?.fontStyle === "italic" ? "font-style:italic;" : "";
      const fontWeight = element.style?.fontWeight === "bold" ? "font-weight:700;" : "";
      const fontSize = element.style?.fontSize ? `font-size:${element.style.fontSize}px;` : "";
      const textAlign = element.style?.textAlign ? `text-align:${element.style.textAlign};` : "";
      const color = element.style?.color ? `color:${element.style.color};` : "";
      const extra = `${fontStyle}${fontWeight}${fontSize}${textAlign}${color}`;
      if (element.type === "list") {
        const listItems = element.content.split("\n").filter(i => i.trim());
        html += `<ul class="abs" style="${style}${extra}">`;
        for (const item of listItems) {
          const clean = item.replace(/^[•\-\*\u2022]\s*/, "");
          html += `<li>${escapeHtml(clean)}</li>`;
        }
        html += `</ul>`;
      } else if (element.type === "heading") {
        const level = Math.min(element.level || 2, 6);
        html += `<h${level} class="abs" style="${style}${extra}">${escapeHtml(element.content)}</h${level}>`;
      } else {
        html += `<div class="abs" style="${style}${extra}">${escapeHtml(element.content)}</div>`;
      }
    }
    html += `</div>`;
  } else {
    for (const element of structure.elements) {
      switch (element.type) {
        case "heading": {
          const level = Math.min(element.level || 2, 6);
          html += `<h${level}>${escapeHtml(element.content)}</h${level}>\n`;
          break;
        }
        case "list": {
          html += "<ul>\n";
          const listItems = element.content.split("\n").filter(item => item.trim());
          for (const item of listItems) {
            const cleanItem = item.replace(/^[•\-\*\u2022]\s*/, "");
            html += `<li>${escapeHtml(cleanItem)}</li>\n`;
          }
          html += "</ul>\n";
          break;
        }
        default:
          html += `<p>${escapeHtml(element.content)}</p>\n`;
          break;
      }
    }
  }

  html += "\n</body>\n</html>";
  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
