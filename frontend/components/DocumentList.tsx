import React from "react";
import { Link } from "react-router-dom";
import { FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Document } from "~backend/document/types";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
        <p className="text-gray-600 mb-6">Upload your first image to get started</p>
        <Link to="/">
          <Button>Upload Document</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <div
          key={document.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
