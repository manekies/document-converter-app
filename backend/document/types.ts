export interface Document {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  processingStatus: ProcessingStatus;
  extractedText?: string;
  detectedLanguage?: string;
  documentStructure?: DocumentStructure;
  createdAt: Date;
  updatedAt: Date;
}

export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

export interface DocumentStructure {
  elements: DocumentElement[];
  metadata: {
    pageCount: number;
    orientation: "portrait" | "landscape";
    dimensions: { width: number; height: number };
  };
}

export interface DocumentElement {
  type: "heading" | "paragraph" | "table" | "list" | "image" | "formula";
  content: string;
  position: { x: number; y: number; width: number; height: number };
  style: {
    fontSize?: number;
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    textAlign?: "left" | "center" | "right" | "justify";
    color?: string;
    backgroundColor?: string;
  };
  level?: number; // for headings and list items
}

export interface DocumentOutput {
  id: string;
  documentId: string;
  format: OutputFormat;
  filePath: string;
  fileSize: number;
  createdAt: Date;
}

export type OutputFormat = "docx" | "pdf" | "html" | "markdown" | "txt";

export interface UploadResponse {
  documentId: string;
  uploadUrl: string;
}

export interface ProcessingResult {
  documentId: string;
  status: ProcessingStatus;
  extractedText?: string;
  detectedLanguage?: string;
  documentStructure?: DocumentStructure;
  error?: string;
}

export interface ConversionRequest {
  documentId: string;
  format: OutputFormat;
  mode: "exact" | "editable";
}

export interface ConversionResponse {
  outputId: string;
  downloadUrl: string;
}
