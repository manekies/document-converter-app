import React, { useMemo, useState } from "react";
import { Download, FileText, Eye, Edit, RefreshCw, Code, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { ConversionPanel } from "./ConversionPanel";
import { DocumentEditor } from "./DocumentEditor";
import type { Document } from "~backend/document/types";
import backend from "~backend/client";

interface DocumentViewerProps {
  document: Document;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [doc, setDoc] = useState(document);
  const [processingMode, setProcessingMode] = useState<"auto" | "local" | "cloud">("auto");
  const [quality, setQuality] = useState<"fast" | "best">("best");
  const [languages, setLanguages] = useState<string>("");
  const { toast } = useToast();

  const handleReprocess = async () => {
    setIsProcessing(true);
    try {
      const langs = languages.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
      await backend.document.process({ documentId: doc.id, mode: processingMode, quality, languages: langs.length > 0 ? langs : undefined });
      toast({
        title: "Reprocessing started",
        description: "Your document is being reprocessed.",
      });
    } catch (error) {
      console.error("Reprocess error:", error);
      toast({
        title: "Reprocessing failed",
        description: "There was an error reprocessing your document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const htmlPreview = useMemo(() => {
    if (!doc.documentStructure) return null;
    // Inline simple renderer
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:system-ui, Arial, sans-serif;margin:0;padding:16px;line-height:1.6;color:#111827}
      h1,h2,h3,h4,h5,h6{margin:1em 0 .5em}
      p{margin:.5em 0}
      ul{margin:.5em 0 .5em 1.25em}
      li{margin:.25em 0}
      table{border-collapse:collapse;width:100%}th,td{border:1px solid #e5e7eb;padding:6px 8px}
    </style></head><body>`;
    for (const el of doc.documentStructure.elements) {
      if (el.type === "heading") {
        const lvl = Math.min(el.level ?? 2, 6);
        html += `<h${lvl}>${escapeHtml(el.content)}</h${lvl}>`;
      } else if (el.type === "list") {
        const items = el.content.split("\n").filter(i => i.trim());
        html += "<ul>";
        for (const it of items) {
          html += `<li>${escapeHtml(it.replace(/^[•\\-\\*\\u2022]\\s*/, ""))}</li>`;
        }
        html += "</ul>";
      } else if (el.type === "table" && el.table) {
        html += "<table><tbody>";
        for (const row of el.table.rows) {
          html += "<tr>";
          for (const cell of row) {
            html += `<td>${escapeHtml(cell.text)}</td>`;
          }
          html += "</tr>";
        }
        html += "</tbody></table>";
      } else {
        html += `<p>${escapeHtml(el.content)}</p>`;
      }
    }
    html += "</body></html>";
    return html;
  }, [doc.documentStructure]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <FileText className="h-8 w-8 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {doc.originalFilename}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <StatusBadge status={doc.processingStatus} />
                <span className="text-sm text-gray-500">
                  {formatFileSize(doc.fileSize)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(doc.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center gap-2 mr-4">
              <Cog className="h-4 w-4 text-gray-600" />
              <Select value={processingMode} onValueChange={(v) => setProcessingMode(v as any)}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="local">Secure local</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                </SelectContent>
              </Select>
              <Select value={quality} onValueChange={(v) => setQuality(v as any)}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="langs: eng,rus (optional)"
                className="w-56"
              />
            </div>
            {doc.processingStatus === "failed" && (
              <Button
                variant="outline"
                onClick={handleReprocess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Reprocess
              </Button>
            )}
          </div>
        </div>

        {doc.detectedLanguage && (
          <div className="text-sm text-gray-600">
            <strong>Detected Language:</strong> {doc.detectedLanguage.toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      {doc.processingStatus === "completed" && (doc.extractedText || doc.documentStructure) ? (
        <Tabs defaultValue="preview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="convert">
              <Download className="h-4 w-4 mr-2" />
              Convert & Download
            </TabsTrigger>
            <TabsTrigger value="raw">
              <Code className="h-4 w-4 mr-2" />
              Raw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-0 overflow-hidden">
              {htmlPreview ? (
                <iframe
                  title="Preview"
                  className="w-full h-[480px] bg-white"
                  srcDoc={htmlPreview}
                />
              ) : (
                <div className="p-6 text-gray-600">No structure available to preview.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <DocumentEditor
              document={doc}
              onSaved={async () => {
                // Reload latest
                const fresh = await backend.document.get({ id: doc.id });
                setDoc(fresh);
              }}
            />
          </TabsContent>

          <TabsContent value="convert">
            <ConversionPanel document={doc} />
          </TabsContent>

          <TabsContent value="raw" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extracted Text</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {doc.extractedText}
                </pre>
              </div>
            </div>

            {doc.documentStructure && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Structure (JSON)</h2>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre text-xs text-gray-700">
                    {JSON.stringify(doc.documentStructure, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : doc.processingStatus === "processing" ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Document</h2>
          <p className="text-gray-600">
            We're extracting text and analyzing the structure of your document. This may take a few moments.
          </p>
        </div>
      ) : doc.processingStatus === "failed" ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Failed</h2>
          <p className="text-gray-600 mb-6">
            There was an error processing your document. Please try reprocessing or upload a different image.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
            <div className="flex items-center gap-2">
              <Select value={processingMode} onValueChange={(v) => setProcessingMode(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="local">Secure local</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                </SelectContent>
              </Select>
              <Select value={quality} onValueChange={(v) => setQuality(v as any)}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="langs: eng,rus (optional)"
                className="w-56"
              />
            </div>
            <Button onClick={handleReprocess} disabled={isProcessing}>
              {isProcessing ? (
                <LoadingSpinner className="h-4 w-4 mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-yellow-500 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Pending</h2>
          <p className="text-gray-600">
            Your document is queued for processing. Please check back in a few moments.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    processing: { color: "bg-blue-100 text-blue-800", label: "Processing" },
    completed: { color: "bg-green-100 text-green-800", label: "Completed" },
    failed: { color: "bg-red-100 text-red-800", label: "Failed" },
  };

  const { color, label } = config[status as keyof typeof config] || config.pending;

  return (
    <Badge variant="secondary" className={color}>
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

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
