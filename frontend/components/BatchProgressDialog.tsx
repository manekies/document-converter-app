import React from "react";
import { X } from "lucide-react";
import backend from "~backend/client";
import type { BatchProgressEvent, OutputFormat } from "~backend/document/types";

interface Props {
  open: boolean;
  onClose: () => void;
  documentIds: string[];
  format?: OutputFormat;
  mode?: "exact" | "editable";
  processingMode?: "auto" | "local" | "cloud";
  languages?: string[];
  template?: string;
  fontFamily?: string;
}

export function BatchProgressDialog({ open, onClose, documentIds, format, mode, processingMode, languages, template, fontFamily }: Props) {
  const [events, setEvents] = React.useState<Record<string, BatchProgressEvent>>({});

  React.useEffect(() => {
    let aborted = false;
    if (!open) return;

    async function run() {
      try {
        const stream = await (backend as any).document.batchProcessStream({
          documentIds,
          convertTo: format,
          mode,
          processingMode,
          languages,
          template,
          fontFamily,
        });
        for await (const ev of stream) {
          if (aborted) break;
          setEvents(prev => ({ ...prev, [ev.documentId]: ev }));
          if (ev.status === "completed" && ev.downloadUrl) {
            // Optional: open automatically
            // window.open(ev.downloadUrl, "_blank");
          }
        }
      } catch (err) {
        console.error("Batch stream error:", err);
      }
    }
    run();

    return () => {
      aborted = true;
    };
  }, [open, documentIds, format, mode, processingMode, languages, template, fontFamily]);

  if (!open) return null;

  const list = documentIds.map(id => events[id] ?? { documentId: id, status: "queued", progress: 0 } as BatchProgressEvent);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold text-gray-900">Batch Progress</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <ul className="space-y-3">
            {list.map(ev => (
              <li key={ev.documentId} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{ev.documentId}</div>
                  <div className="text-sm text-gray-600 capitalize">{ev.status}</div>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded">
                  <div className="h-2 bg-blue-600 rounded" style={{ width: `${Math.min(100, Math.max(0, ev.progress ?? 0))}%` }} />
                </div>
                {ev.message && <div className="text-xs text-gray-500 mt-1">{ev.message}</div>}
                {ev.error && <div className="text-xs text-red-600 mt-1">{ev.error}</div>}
                {ev.downloadUrl && (
                  <div className="mt-2">
                    <a href={ev.downloadUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Download</a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t p-3 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800">Close</button>
        </div>
      </div>
    </div>
  );
}
