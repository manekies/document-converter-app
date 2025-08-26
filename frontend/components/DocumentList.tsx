import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Clock, CheckCircle, XCircle, Eye, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { Document, OutputFormat } from "~backend/document/types";
import backend from "~backend/client";
import { BatchProgressDialog } from "./BatchProgressDialog";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [format, setFormat] = useState<OutputFormat>("pdf");
  const [mode, setMode] = useState<"exact" | "editable">("editable");
  const [running, setRunning] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === documents.length;

  const toggleSelect = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const map: Record<string, boolean> = {};
      for (const d of documents) map[d.id] = true;
      setSelected(map);
    }
  };

  const runBatch = async () => {
    if (selectedIds.length === 0) return;
    setRunning(true);
    try {
      // Prefer streaming progress
      setShowDialog(true);
    } catch (err) {
      console.error("Batch error:", err);
      toast({
        title: "Batch failed",
        description: "Some or all items failed to process.",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
        <button
          onClick={toggleSelectAll}
          className="flex items-center text-sm text-gray-700"
          aria-label="Toggle select all"
        >
          {allSelected ? <CheckSquare className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
          Select all
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="docx">DOCX</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="txt">TXT</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={(v) => setMode(v as "exact" | "editable")}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editable">Editable</SelectItem>
              <SelectItem value="exact">Exact</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={runBatch} disabled={running || selectedIds.length === 0}>
            {running ? "Processing..." : `Convert ${selectedIds.length}`}
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-6">Upload your first image to get started</p>
        </div>
      ) : null}

      {documents.map((document) => (
        <div
          key={document.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleSelect(document.id)}
                className="text-gray-600"
                aria-label="Toggle select"
              >
                {selected[document.id] ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {document.originalFilename}
                </h3>
                <div className="flex items-center space-x-4 mt-1">
                  <StatusBadge status={document.processingStatus} />
                  <span className="text-sm text-gray-500">
                    {formatFileSize(document.fileSize)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(document.createdAt)}
                  </span>
                  {document.detectedLanguage && (
                    <span className="text-sm text-gray-500">
                      Language: {document.detectedLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link to={`/document/${document.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}

      <BatchProgressDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        documentIds={selectedIds}
        format={format}
        mode={mode}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    processing: { icon: Clock, color: "bg-blue-100 text-blue-800", label: "Processing" },
    completed: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "Completed" },
    failed: { icon: XCircle, color: "bg-red-100 text-red-800", label: "Failed" },
  };

  const { icon: Icon, color, label } = config[status as keyof typeof config] || config.pending;

  return (
    <Badge variant="secondary" className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
