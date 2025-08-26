import React, { useMemo } from "react";
import type { DocumentStructure, DocumentElement } from "~backend/document/types";

interface Props {
  structure: DocumentStructure;
}

export function DocumentLivePreview({ structure }: Props) {
  const html = useMemo(() => renderHTML(structure), [structure]);
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <iframe title="Live Preview" className="w-full h-[420px]" srcDoc={html} />
    </div>
  );
}

function renderHTML(structure: DocumentStructure): string {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:system-ui,Arial,sans-serif;margin:0;padding:16px;line-height:1.6;color:#111827}
    h1,h2,h3,h4,h5,h6{margin:1em 0 .5em}
    p{margin:.5em 0}
    ul{margin:.5em 0 .5em 1.25em}
    li{margin:.25em 0}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #e5e7eb;padding:6px 8px}
    img{max-width:100%}
  </style></head><body>`;
  for (const el of structure.elements) {
    html += elementToHTML(el);
  }
  html += "</body></html>";
  return html;
}

function elementToHTML(el: DocumentElement): string {
  if (el.type === "heading") {
    const lvl = Math.min(el.level ?? 2, 6);
    return `<h${lvl}>${escapeHtml(el.content)}</h${lvl}>`;
  } else if (el.type === "list") {
    const items = el.content.split("\n").filter(i => i.trim());
    return `<ul>${items.map(it => `<li>${escapeHtml(it.replace(/^[•\\-\\*\\u2022]\\s*/, ""))}</li>`).join("")}</ul>`;
  } else if (el.type === "table" && el.table) {
    return `<table><tbody>${el.table.rows.map(row => `<tr>${row.map(c => `<td>${escapeHtml(c.text)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  } else if (el.type === "image" && el.imageSrc) {
    const w = el.imageWidth ?? el.position.width;
    const h = el.imageHeight ?? el.position.height;
    return `<img src="${el.imageSrc}" alt="${escapeHtml(el.content)}" style="width:${w}px;height:${h}px;"/>`;
  }
  return `<p>${escapeHtml(el.content)}</p>`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
