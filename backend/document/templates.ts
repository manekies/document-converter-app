import { api, APIError } from "encore.dev/api";
import { documentDB } from "./db";
import type { Template, TemplateStyles } from "./types";

// Lists available export templates (built-in + custom).
export const listTemplates = api<void, { templates: { name: string }[] }>(
  { expose: true, method: "GET", path: "/templates" },
  async () => {
    const rows = await documentDB.queryAll<{ name: string }>`
      SELECT name FROM export_templates
      ORDER BY name ASC
    `;
    const builtin = ["modern", "classic", "compact"].map(name => ({ name }));
    const custom = rows.map(r => ({ name: r.name }));
    // Deduplicate
    const map = new Map<string, { name: string }>();
    for (const t of [...builtin, ...custom]) map.set(t.name, t);
    return { templates: Array.from(map.values()) };
  }
);

// Creates or updates a custom template.
export const upsertTemplate = api<{ name: string; data: TemplateStyles }, Template>(
  { expose: true, method: "POST", path: "/templates" },
  async (req) => {
    if (!req.name) throw APIError.invalidArgument("name is required");
    const row = await documentDB.queryRow<{ id: string; name: string; data: any; created_at: Date }>`
      INSERT INTO export_templates (name, data)
      VALUES (${req.name}, ${JSON.stringify(req.data)})
      ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      RETURNING id, name, data, created_at
    `;
    return { id: row!.id, name: row!.name, data: row!.data as TemplateStyles, createdAt: row!.created_at };
  }
);
