import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { CompareRequest, CompareResponse } from "./types";
import { computeCERWER } from "./utils/metrics";

// Computes a diff visualization and similarity metrics between two documents.
export const compare = api<CompareRequest, CompareResponse>(
  { expose: true, method: "POST", path: "/document/compare" },
  async (req) => {
    if (!req.aId || !req.bId) {
      throw APIError.invalidArgument("aId and bId are required");
    }

    const a = await documentDB.queryRow<{ extracted_text: string | null; document_structure: string | null }>`
      SELECT extracted_text, document_structure FROM documents WHERE id = ${req.aId}
    `;
    const b = await documentDB.queryRow<{ extracted_text: string | null; document_structure: string | null }>`
      SELECT extracted_text, document_structure FROM documents WHERE id = ${req.bId}
    `;
    if (!a || !b) throw APIError.notFound("one or both documents not found");

    const mode = req.mode ?? "text";
    let aText = a.extracted_text ?? "";
    let bText = b.extracted_text ?? "";

    if (mode === "structure") {
      const aStruct = a.document_structure ? JSON.parse(a.document_structure) : null;
      const bStruct = b.document_structure ? JSON.parse(b.document_structure) : null;
      aText = aStruct ? flattenStructure(aStruct) : aText;
      bText = bStruct ? flattenStructure(bStruct) : bText;
    }

    const diffHtml = renderDiff(aText, bText);
    const { cer, wer } = computeCERWER(aText, bText);

    return {
      summary: {
        aId: req.aId,
        bId: req.bId,
        mode,
        cer,
        wer,
        equal: aText === bText,
      },
      diffHtml,
    };
  }
);

function flattenStructure(struct: any): string {
  const parts: string[] = [];
  for (const el of struct.elements ?? []) {
    if (el.type === "heading") parts.push(`# ${el.content}`);
    else if (el.type === "list") parts.push(el.content.split("\n").map((x: string) => `- ${x}`).join("\n"));
    else if (el.type === "table" && el.table) parts.push(el.table.rows.map((r: any[]) => r.map(c => c.text).join(" | ")).join("\n"));
    else parts.push(el.content);
  }
  return parts.join("\n");
}

function renderDiff(a: string, b: string): string {
  // Simple Myers diff on words
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  const { lcs, trace } = diffTrace(aWords, bWords);
  const out: string[] = [];
  let i = 0, j = 0;
  for (const [x, y] of lcs) {
    while (i < x) out.push(`<del style="background:#fee2e2;">${escape(aWords[i++])}</del>`);
    while (j < y) out.push(`<ins style="background:#dcfce7;">${escape(bWords[j++])}</ins>`);
    out.push(`<span>${escape(aWords[i++])}</span>`);
    j++;
  }
  while (i < aWords.length) out.push(`<del style="background:#fee2e2;">${escape(aWords[i++])}</del>`);
  while (j < bWords.length) out.push(`<ins style="background:#dcfce7;">${escape(bWords[j++])}</ins>`);
  return `<div style="font-family:system-ui,Arial,sans-serif;line-height:1.6;word-wrap:break-word">${out.join(" ")}</div>`;
}

function diffTrace(a: string[], b: string[]) {
  // Myers diff O((N+M)D)
  const N = a.length, M = b.length;
  const MAX = N + M;
  const v: Record<number, number> = { 1: 0 };
  const trace: Record<number, Record<number, number>> = {};
  for (let d = 0; d <= MAX; d++) {
    trace[d] = {};
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[k - 1] < v[k + 1])) x = v[k + 1];
      else x = v[k - 1] + 1;
      let y = x - k;
      while (x < N && y < M && a[x] === b[y]) { x++; y++; }
      v[k] = x;
      trace[d][k] = x;
      if (x >= N && y >= M) return { trace, lcs: backtrack(trace, a, b) };
    }
  }
  return { trace, lcs: backtrack(trace, a, b) };
}

function backtrack(trace: Record<number, Record<number, number>>, a: string[], b: string[]) {
  let x = a.length, y = b.length;
  const result: Array<[number, number]> = [];
  for (let d = Object.keys(trace).length - 1; d >= 0; d--) {
    const row = trace[d];
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && row[k - 1] < row[k + 1])) prevK = k + 1;
    else prevK = k - 1;
    const prevX = row[prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      result.push([x - 1, y - 1]);
      x--; y--;
    }
    x = prevX;
    y = prevY;
  }
  return result.reverse();
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
