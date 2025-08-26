import React, { useState } from "react";
import { Download, FileText, Globe, Code, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import type { Document, OutputFormat } from "~backend/document/types";
import backend from "~backend/client";

interface ConversionPanelProps {
  document: Document;
}

export function ConversionPanel({ document }: ConversionPanelProps) {
  const [format, setFormat] = useState<OutputFormat>("docx");
  const [mode, setMode] = useState<"exact" | "editable">("editable");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const formatOptions = [
    { value: "docx", label: "Microsoft Word (.docx)", icon: FileText },
    { value: "pdf", label: "PDF Document (.pdf)", icon: File },
    { value: "html", label: "HTML Web Page (.html)", icon: Globe },
    { value: "markdown", label: "Markdown (.md)", icon: Code },
    { value: "txt", label: "Plain Text (.txt)", icon: FileText },
  ] as const;

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const result = await backend.document.convert({
        documentId: document.id,
        format,
        mode,
      });

      // Open download URL in new tab
      window.open(result.downloadUrl, "_blank");

      toast({
        title: "Conversion successful",
        description: `Your document has been converted to ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion failed",
        description: "There was an error converting your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Convert Document</h2>
        <p className="text-gray-600 mb-6">
          Choose your preferred format and conversion mode to download your document.
        </p>
      </div>

      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Output Format
          </Label>
          <Select value={format} onValueChange={(value) => setFormat(value as OutputFormat)}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Mode Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Conversion Mode
          </Label>
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as "exact" | "editable")}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                <RadioGroupItem value="editable" id="editable" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="editable" className="font-medium text-gray-900 cursor-pointer">
                    Editable Mode (Recommended)
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Optimized for editing with proper headings, paragraphs, and structure. 
                    Best for documents you plan to modify.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                <RadioGroupItem value="exact" id="exact" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="exact" className="font-medium text-gray-900 cursor-pointer">
                    Exact Mode
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Preserves original layout and formatting as closely as possible. 
                    Best for documents that need to look identical to the original.
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Convert Button */}
        <div className="pt-4 border-t border-gray-200">
          <Button 
            onClick={handleConvert} 
            disabled={isConverting}
            className="w-full"
            size="lg"
          >
            {isConverting ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Converting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Convert & Download
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
