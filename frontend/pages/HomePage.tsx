import React from "react";
import { UploadZone } from "../components/UploadZone";
import { FeatureCard } from "../components/FeatureCard";
import { FileText, Zap, Download, Eye } from "lucide-react";

export function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Convert Any Image to Editable Document
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Transform photos, scans, screenshots, and handwritten notes into fully editable documents 
          while preserving formatting and structure.
        </p>
      </div>

      <div className="mb-16">
        <UploadZone />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <FeatureCard
          icon={<FileText className="h-8 w-8 text-blue-600" />}
          title="Smart OCR"
          description="Advanced text recognition for printed and handwritten content"
        />
        <FeatureCard
          icon={<Zap className="h-8 w-8 text-green-600" />}
          title="Auto Enhancement"
          description="Automatically cleans, straightens, and optimizes image quality"
        />
        <FeatureCard
          icon={<Eye className="h-8 w-8 text-purple-600" />}
          title="Structure Detection"
          description="Identifies headings, paragraphs, tables, and lists automatically"
        />
        <FeatureCard
          icon={<Download className="h-8 w-8 text-orange-600" />}
          title="Multiple Formats"
          description="Export to DOCX, PDF, HTML, Markdown, and more"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Image</h3>
            <p className="text-gray-600">
              Upload any image containing text - photos, scans, screenshots, or handwritten notes
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Processing</h3>
            <p className="text-gray-600">
              Our AI enhances the image, extracts text, and identifies document structure
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Download Document</h3>
            <p className="text-gray-600">
              Get your editable document in your preferred format, ready for editing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
