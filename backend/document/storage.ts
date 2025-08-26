import { Bucket } from "encore.dev/storage/objects";

export const originalImages = new Bucket("original-images");
export const processedDocuments = new Bucket("processed-documents");
// Optional fonts bucket for embedding cross-script fonts (e.g., Noto Sans)
// If not present, PDF export falls back to built-in fonts.
export const fontsBucket = new Bucket("doc-fonts");
