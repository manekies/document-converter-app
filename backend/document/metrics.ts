import { api } from "encore.dev/api";
import { documentDB } from "./db";

export interface DashboardResponse {
  totals: {
    documents: number;
    processed: number;
    failed: number;
  };
  performance: {
    avgConfidence: number;
    avgDurationMs: number;
  };
  providerShare: {
    ocr: Record<string, number>;
    llm: Record<string, number>;
  };
  recentRuns: {
    id: string;
    documentId: string;
    status: string;
    ocrProvider: string;
    llmProvider?: string | null;
    confidence: number | null;
    durationMs: number | null;
    createdAt: Date;
  }[];
}

// Returns aggregated processing metrics for dashboards.
export const getDashboard = api<void, DashboardResponse>(
  { expose: true, method: "GET", path: "/metrics/dashboard" },
  async () => {
    const totalsRow = await documentDB.queryRow<{ documents: number }>`
      SELECT COUNT(*)::int AS documents FROM documents
    `;
    const processedRow = await documentDB.queryRow<{ processed: number; failed: number }>`
      SELECT 
        SUM(CASE WHEN processing_status = 'completed' THEN 1 ELSE 0 END)::int AS processed,
        SUM(CASE WHEN processing_status = 'failed' THEN 1 ELSE 0 END)::int AS failed
      FROM documents
    `;

    const perf = await documentDB.queryRow<{ avg_conf: number | null; avg_dur: number | null }>`
      SELECT AVG(confidence) AS avg_conf, AVG(duration_ms) AS avg_dur FROM processing_runs
    `;

    const ocrShareRows = await documentDB.queryAll<{ provider: string; cnt: number }>`
      SELECT ocr_provider AS provider, COUNT(*)::int AS cnt 
      FROM processing_runs 
      GROUP BY ocr_provider
    `;
    const llmShareRows = await documentDB.queryAll<{ provider: string; cnt: number }>`
      SELECT COALESCE(llm_provider, 'none') AS provider, COUNT(*)::int AS cnt 
      FROM processing_runs 
      GROUP BY COALESCE(llm_provider, 'none')
    `;

    const recentRuns = await documentDB.queryAll<{
      id: string;
      document_id: string;
      status: string;
      ocr_provider: string;
      llm_provider: string | null;
      confidence: number | null;
      duration_ms: number | null;
      created_at: Date;
    }>`
      SELECT id, document_id, status, ocr_provider, llm_provider, confidence, duration_ms, created_at
      FROM processing_runs
      ORDER BY created_at DESC
      LIMIT 25
    `;

    const ocrShare: Record<string, number> = {};
    for (const r of ocrShareRows) ocrShare[r.provider] = r.cnt;
    const llmShare: Record<string, number> = {};
    for (const r of llmShareRows) llmShare[r.provider] = r.cnt;

    return {
      totals: {
        documents: totalsRow?.documents ?? 0,
        processed: processedRow?.processed ?? 0,
        failed: processedRow?.failed ?? 0,
      },
      performance: {
        avgConfidence: perf?.avg_conf ?? 0,
        avgDurationMs: perf?.avg_dur ?? 0,
      },
      providerShare: {
        ocr: ocrShare,
        llm: llmShare,
      },
      recentRuns: recentRuns.map(r => ({
        id: r.id,
        documentId: r.document_id,
        status: r.status,
        ocrProvider: r.ocr_provider,
        llmProvider: r.llm_provider,
        confidence: r.confidence,
        durationMs: r.duration_ms,
        createdAt: r.created_at,
      })),
    };
  }
);
