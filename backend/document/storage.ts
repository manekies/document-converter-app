import { Bucket } from "encore.dev/storage/objects";

export const originalImages = new Bucket("original-images");
export const processedDocuments = new Bucket("processed-documents");
