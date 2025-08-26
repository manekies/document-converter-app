import type { DocumentStructure } from "../types";

export function generateMarkdown(structure: DocumentStructure, mode: "exact" | "editable"): string {
  // For "exact" we still output standard Markdown; exactness is better served by PDF/DOCX.
  let md = "";
  for (const element of structure.elements) {
    switch (element.type) {
      case "heading": {
        const level = Math.min(element.level || 1, 6);
        md += `${"#".repeat(level)} ${element.content}\n\n`;
        break;
      }
      case "list": {
        const listItems = element.content.split("\n").filter(item => item.trim());
        for (const item of listItems) {
          const clean = item.replace(/^[•\-\*\u2022]\s*/, "");
          md += `- ${clean}\n`;
        }
        md += "\n";
        break;
      }
      case "table": {
        const rows = element.table?.rows ?? [];
        if (rows.length > 0) {
          // header
          md += `| ${rows[0].map(c => c.text.trim()).join(" | ")} |\n`;
          md += `| ${rows[0].map(() => "---").join(" | ")} |\n`;
          for (const row of rows.slice(1)) {
            md += `| ${row.map(c => c.text.trim()).join(" | ")} |\n`;
          }
          md += "\n";
        }
        break;
      }
      default:
        md += `${element.content}\n\n`;
        break;
    }
  }
  return md;
}
