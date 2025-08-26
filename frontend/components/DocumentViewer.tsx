import React, { useState } from "react";
import { Download, FileText, Eye, Edit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { ConversionPanel } from "./ConversionPanel";
import type { Document } from "~backend/document/types";
import backend from "~backend/client";

interface DocumentViewerProps {
  document: Document;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleReprocess = async () => {
    setIsProcessing(true);
    try {
      await backend.document.process({ documentId: document.id });
      toast({
        title: "Reprocessing started",
        description: "Your document is being reprocessed.",
      });
      // In a real app, you'd refresh the document data
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <FileText className="h-8 w-8 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {document.originalFilename}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <StatusBadge status={document.processingStatus} />
                <span className="text-sm text-gray-500">
                  {formatFileSize(document.fileSize)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(document.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {document.processingStatus === "failed" && (
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

        {document.detectedLanguage && (
          <div className="text-sm text-gray-600">
            <strong>Detected Language:</strong> {document.detectedLanguage.toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      {document.processingStatus === "completed" && document.extractedText ? (
        <Tabs defaultValue="preview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="convert">
              <Download className="h-4 w-4 mr-2" />
              Convert & Download
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extracted Text</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {document.extractedText}
                </pre>
              </div>
            </div>

            {document.documentStructure && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Structure</h2>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>Elements:</strong> {document.documentStructure.elements.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Pages:</strong> {document.documentStructure.metadata.pageCount}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Orientation:</strong> {document.documentStructure.metadata.orientation}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="convert">
            <ConversionPanel document={document} />
          </TabsContent>
        </Tabs>
      ) : document.processingStatus === "processing" ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Document</h2>
          <p className="text-gray-600">
            We're extracting text and analyzing the structure of your document. This may take a few moments.
          </p>
        </div>
      ) : document.processingStatus === "failed" ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Failed</h2>
          <p className="text-gray-600 mb-6">
            There was an error processing your document. Please try reprocessing or upload a different image.
          </p>
          <Button onClick={handleReprocess} disabled={isProcessing}>
            {isProcessing ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Try Again
          </Button>
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
