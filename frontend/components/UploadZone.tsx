import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { Upload, FileImage, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import backend from "~backend/client";

export function UploadZone() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Get upload URL
      const uploadResponse = await backend.document.upload({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      // Upload file to signed URL
      const uploadResult = await fetch(uploadResponse.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file");
      }

      // Start processing
      await backend.document.process({ documentId: uploadResponse.documentId });

      toast({
        title: "Upload successful",
        description: "Your document is being processed. You'll be redirected shortly.",
      });

      // Redirect to document page
      setTimeout(() => {
        navigate(`/document/${uploadResponse.documentId}`);
      }, 1000);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, navigate]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? "border-blue-400 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
          }
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <LoadingSpinner />
            <p className="text-gray-600">Uploading and processing your document...</p>
          </div>
        ) : (
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
                {isDragActive ? "Drop your image here" : "Upload an image to convert"}
              </p>
              <p className="text-gray-600 mb-4">
                Drag and drop an image file, or click to browse
              </p>
              <Button variant="outline">
                Choose File
              </Button>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Supported formats: PNG, JPG, JPEG, GIF, BMP, WebP</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </div>

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
