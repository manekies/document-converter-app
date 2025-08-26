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
    template?: string; // optional template name applied during export/render
    fontFamily?: string; // preferred font family (e.g., "Noto Sans")
  };
}

export interface DocumentStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right" | "justify";
  color?: string;
  backgroundColor?: string;
  textDecoration?: "underline" | "line-through";
  lineHeight?: number;
}

export interface TableCell {
  text: string;
  colSpan?: number;
  rowSpan?: number;
  style?: DocumentStyle;
}

export interface TableData {
  rows: TableCell[][];
  columnWidths?: number[];
}

export interface DocumentElement {
  type: "heading" | "paragraph" | "table" | "list" | "image" | "formula";
  content: string;
  position: { x: number; y: number; width: number; height: number };
  style: DocumentStyle;
  level?: number; // for headings and list items
  imageSrc?: string; // path in object storage or URL
  imageWidth?: number;
  imageHeight?: number;
  table?: TableData;
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
  // Optional template name to influence export styles (e.g., "modern", "classic")
  template?: string;
  // Optional preferred font family, when available in fonts bucket (e.g., "Noto Sans")
  fontFamily?: string;
}

export interface ConversionResponse {
  outputId: string;
  downloadUrl: string;
}

export interface UpdateDocumentRequest {
  id: string;
  extractedText?: string;
  documentStructure?: DocumentStructure;
}

export interface UpdateDocumentResponse {
  id: string;
  updatedAt: Date;
}

export interface PreviewRequest {
  id: string;
  mode?: "exact" | "editable";
  template?: string;
}

export interface PreviewResponse {
  html: string;
}

export interface BatchProcessRequest {
  documentIds: string[];
  convertTo?: OutputFormat;
  mode?: "exact" | "editable";
  // Orchestration mode for processing stage
  processingMode?: "auto" | "local" | "cloud";
  // Optional preferred OCR languages (Tesseract codes like "eng", "rus", "deu"), multi-language supported via "+"
  languages?: string[];
  template?: string;
  fontFamily?: string;
}

export interface BatchProcessItemResult {
  documentId: string;
  status: ProcessingStatus;
  error?: string;
  conversion?: {
    outputId: string;
    downloadUrl: string;
  };
}

export interface BatchProcessResponse {
  results: BatchProcessItemResult[];
}

export interface ListOutputsRequest {
  documentId: string;
}

export interface ListOutputsResponse {
  outputs: DocumentOutput[];
}

// NLP helpers
export interface SpellcheckRequest {
  text: string;
  language?: string; // BCP-47 or ISO language code; if omitted, autodetect
}

export interface SpellcheckResponse {
  correctedText: string;
  suggestions?: string[];
}

export interface TranslateRequest {
  text: string;
  sourceLanguage?: string; // autodetect if not provided
  targetLanguage: string;
}

export interface TranslateResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

// Templates
export interface Template {
  id: string;
  name: string;
  data: TemplateStyles;
  createdAt: Date;
}

export interface TemplateStyles {
  name: string;
  page?: {
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    backgroundColor?: string;
  };
  fonts?: {
    fontFamily?: string;
    headingFontFamily?: string;
    monoFontFamily?: string;
  };
  headings?: {
    h1?: Partial<DocumentStyle>;
    h2?: Partial<DocumentStyle>;
    h3?: Partial<DocumentStyle>;
    h4?: Partial<DocumentStyle>;
    h5?: Partial<DocumentStyle>;
    h6?: Partial<DocumentStyle>;
  };
  paragraph?: Partial<DocumentStyle>;
  list?: Partial<DocumentStyle>;
  table?: {
    borderColor?: string;
    headerBackground?: string;
  };
}

// Batch streaming
export interface BatchStreamHandshake {
  documentIds: string[];
  convertTo?: OutputFormat;
  mode?: "exact" | "editable";
  processingMode?: "auto" | "local" | "cloud";
  languages?: string[];
  template?: string;
  fontFamily?: string;
}

export interface BatchProgressEvent {
  documentId: string;
  status: "queued" | "processing" | "converting" | "completed" | "failed";
  progress?: number; // 0-100
  message?: string;
  outputId?: string;
  downloadUrl?: string;
  error?: string;
}

// Comparison
export interface CompareRequest {
  aId: string;
  bId: string;
  mode?: "text" | "structure";
}

export interface CompareResponse {
  summary: {
    aId: string;
    bId: string;
    mode: "text" | "structure";
    cer: number;
    wer: number;
    equal: boolean;
  };
  diffHtml: string;
}
