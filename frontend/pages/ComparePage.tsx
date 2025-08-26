import React, { useState } from "react";
import backend from "~backend/client";
import { DiffViewer } from "../components/DiffViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ComparePage() {
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [mode, setMode] = useState<"text" | "structure">("text");
  const [result, setResult] = useState<{ html: string; summary: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!aId || !bId) return;
    setLoading(true);
    try {
      const res = await backend.document.compare({ aId, bId, mode });
      const summary = `CER: ${res.summary.cer.toFixed(3)} | WER: ${res.summary.wer.toFixed(3)} | Equal: ${res.summary.equal ? "Yes" : "No"}`;
      setResult({ html: res.diffHtml, summary });
    } catch (err) {
      console.error("Compare error:", err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Document Comparison</h1>
        <div className="grid md:grid-cols-5 gap-3">
          <Input placeholder="Document A ID" value={aId} onChange={(e) => setAId(e.target.value)} />
          <Input placeholder="Document B ID" value={bId} onChange={(e) => setBId(e.target.value)} />
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger className="md:col-span-2">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="structure">Structure</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={run} disabled={loading}>{loading ? "Comparing..." : "Compare"}</Button>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="text-sm text-gray-700">{result.summary}</div>
          <DiffViewer html={result.html} />
        </div>
      )}
    </div>
  );
}
