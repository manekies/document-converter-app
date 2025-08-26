import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { Upload, FileImage, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import backend from "~backend/client";

type UploadItem = {
  file: File;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  error?: string;
  documentId?: string;
};

export function UploadZone() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    const newItems: UploadItem[] = acceptedFiles.map((f) => ({ file: f, status: "queued" }));
    setItems((prev) => [...prev, ...newItems]);

    // Process with limited concurrency (e.g., 2 at a time)
    const queue = [...newItems];
    const concurrency = 2;
    let active = 0;

    const next = async () => {
      if (queue.length === 0) return;
      if (active >= concurrency) return;
      const item = queue.shift()!;
      active++;
      await handleUpload(item);
      active--;
      await next();
    };

    const starters = Array.from({ length: Math.min(concurrency, queue.length) }, () => next());
    await Promise.all(starters);

    toast({
      title: "Upload complete",
      description: "Processing started for uploaded documents.",
    });

    // Go to list when all finished
    setTimeout(() => {
      navigate("/documents");
    }, 800);
  }, [toast, navigate]);

  const handleUpload = async (item: UploadItem) => {
    setItems((prev) => prev.map((it) => (it === item ? { ...it, status: "uploading" } : it)));

    try {
      const uploadResponse = await backend.document.upload({
        filename: item.file.name,
        mimeType: item.file.type,
        fileSize: item.file.size,
      });

      // Upload file to signed URL
      const uploadResult = await fetch(uploadResponse.uploadUrl, {
        method: "PUT",
        body: item.file,
        headers: {
          "Content-Type": item.file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file");
      }

      setItems((prev) =>
        prev.map((it) => (it === item ? { ...it, status: "processing", documentId: uploadResponse.documentId } : it))
      );

      await backend.document.process({ documentId: uploadResponse.documentId });

      setItems((prev) =>
        prev.map((it) => (it === item ? { ...it, status: "done" } : it))
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      setItems((prev) =>
        prev.map((it) => (it === item ? { ...it, status: "error", error: error?.message ?? "Unknown error" } : it))
      );
      toast({
        title: "Upload failed",
        description: "There was an error uploading one or more files.",
        variant: "destructive",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
    },
    multiple: true,
    maxFiles: 10,
    maxSize: 15 * 1024 * 1024, // 15MB
    disabled: false,
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? "border-blue-400 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            {isDragActive ? (
              <Upload className="h-12 w-12 text-blue-500" />
            ) : (
              <FileImage className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? "Drop images here" : "Upload images to convert"}
            </p>
            <p className="text-gray-600 mb-4">
              Drag and drop image files, or click to browse
            </p>
            <Button variant="outline">
              Choose Files
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Supported formats: PNG, JPG, JPEG, GIF, BMP, WebP</p>
            <p>Maximum file size: 15MB each</p>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Batch</h3>
          <ul className="space-y-2">
            {items.map((it, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="truncate">{it.file.name}</span>
                <span className="flex items-center gap-2">
                  {it.status === "uploading" && <LoadingSpinner className="h-4 w-4" />}
                  {it.status === "processing" && <LoadingSpinner className="h-4 w-4" />}
                  {it.status === "done" && <CheckCircle className="h-4 w-4 text-green-600" />}
                  <span className="text-gray-600 capitalize">{it.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Upload Error</span>
          </div>
          <ul className="mt-2 text-sm text-red-600">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name}: {errors.map(e => e.message).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
