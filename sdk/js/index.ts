/**
 * Minimal JS SDK for the Document Processing API
 */

export interface ClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}

export class DocClient {
  baseUrl: string;
  headers: Record<string, string>;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.headers = opts.headers ?? {};
  }

  async upload(body: { filename: string; mimeType: string; fileSize: number }) {
    return this.post("/document/upload", body);
  }

  async process(body: { documentId: string; mode?: "auto" | "local" | "cloud"; quality?: "fast" | "best" }) {
    return this.post(`/document/${encodeURIComponent(body.documentId)}/process`, body);
  }

  async getDocument(id: string) {
    return this.get(`/document/${encodeURIComponent(id)}`);
  }

  async listDocuments(params?: { limit?: number; offset?: number }) {
    const qs = new URLSearchParams();
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    return this.get(`/documents${qs.toString() ? "?" + qs.toString() : ""}`);
  }

  async convert(body: { documentId: string; format: "docx" | "pdf" | "html" | "markdown" | "txt"; mode: "exact" | "editable" }) {
    return this.post("/document/convert", body);
  }

  async listOutputs(documentId: string) {
    return this.get(`/document/${encodeURIComponent(documentId)}/outputs`);
  }

  async preview(id: string, mode?: "exact" | "editable") {
    const qs = new URLSearchParams();
    if (mode) qs.set("mode", mode);
    return this.get(`/document/${encodeURIComponent(id)}/preview${qs.toString() ? "?" + qs.toString() : ""}`);
  }

  async metricsDashboard() {
    return this.get(`/metrics/dashboard`);
  }

  private async get(path: string) {
    const r = await fetch(`${this.baseUrl}${path}`, { headers: this.headers });
    if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
    return r.json();
  }

  private async post(path: string, body: any) {
    const r = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.headers },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`POST ${path} failed: ${r.status} ${text}`);
    }
    return r.json();
  }
}
