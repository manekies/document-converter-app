import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DocumentList } from "../components/DocumentList";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import backend from "~backend/client";

export function DocumentsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: () => backend.document.list({}),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message="Failed to load documents" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Documents</h1>
          <p className="text-gray-600">
            Manage and download your converted documents
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Refresh
        </button>
      </div>

      <DocumentList documents={data?.documents || []} />
    </div>
  );
}
