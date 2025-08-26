import React from "react";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";

interface DashboardResponse {
  totals: { documents: number; processed: number; failed: number };
  performance: { avgConfidence: number; avgDurationMs: number };
  providerShare: { ocr: Record<string, number>; llm: Record<string, number> };
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

export function MetricsPage() {
  const { data, isLoading, error, refetch } = useQuery<DashboardResponse>({
    queryKey: ["metrics", "dashboard"],
    queryFn: () => backend.document.getDashboard({}),
  } as any);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline Metrics</h1>
          <p className="text-gray-600">End-to-end processing quality and performance</p>
        </div>
        <button onClick={() => refetch()} className="text-sm text-gray-600 hover:text-gray-900 underline">
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-600">Loading...</div>
      ) : error ? (
        <div className="text-red-600">Failed to load metrics</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="Documents" value={data.totals.documents} />
            <Card title="Processed" value={data.totals.processed} />
            <Card title="Failed" value={data.totals.failed} />
            <Card title="Avg Confidence" value={data.performance.avgConfidence.toFixed(2)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Average Duration (ms)</h3>
              <div className="text-3xl font-bold text-gray-900">{Math.round(data.performance.avgDurationMs || 0)}</div>
              <p className="text-sm text-gray-600 mt-1">Average end-to-end processing time</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Provider Share</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-600 mb-1">OCR</h4>
                  <ul className="text-sm text-gray-800 space-y-1">
                    {Object.entries(data.providerShare.ocr).map(([k, v]) => (
                      <li key={k} className="flex justify-between">
                        <span className="capitalize">{k}</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm text-gray-600 mb-1">LLM</h4>
                  <ul className="text-sm text-gray-800 space-y-1">
                    {Object.entries(data.providerShare.llm).map(([k, v]) => (
                      <li key={k} className="flex justify-between">
                        <span className="capitalize">{k}</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Provider details are abstracted for end users.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Runs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">Run ID</th>
                    <th className="py-2 pr-4">Document</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">OCR</th>
                    <th className="py-2 pr-4">LLM</th>
                    <th className="py-2 pr-4">Conf</th>
                    <th className="py-2 pr-4">Duration</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {data.recentRuns.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{r.id.slice(0, 8)}…</td>
                      <td className="py-2 pr-4">{r.documentId.slice(0, 8)}…</td>
                      <td className="py-2 pr-4 capitalize">{r.status}</td>
                      <td className="py-2 pr-4">{r.ocrProvider}</td>
                      <td className="py-2 pr-4">{r.llmProvider ?? "-"}</td>
                      <td className="py-2 pr-4">{r.confidence?.toFixed(2) ?? "-"}</td>
                      <td className="py-2 pr-4">{r.durationMs ?? "-"}</td>
                      <td className="py-2 pr-4">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
