import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DocumentViewer } from "../components/DocumentViewer";
import { VersionHistoryPanel } from "../components/VersionHistoryPanel";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import backend from "~backend/client";

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);

  // Query for the main document data
  const { data: mainDocument, isLoading: isLoadingMain, error: mainError } = useQuery({
    queryKey: ["document", id],
    queryFn: () => backend.document.get({ id: id! }),
    enabled: !!id,
  });

  // Query for the selected version's data, only enabled when a version is selected
  const { data: versionData, isLoading: isLoadingVersion } = useQuery({
    queryKey: ["documentVersion", id, selectedVersionId],
    queryFn: () => backend.document.getVersion({ documentId: id!, versionId: selectedVersionId! }),
    enabled: !!id && !!selectedVersionId,
  });

  const handleSelectVersion = (versionId: string) => {
    setSelectedVersionId(versionId);
  };

  // Memoize the document to display, preferring the selected version's structure
  const displayDocument = useMemo(() => {
    if (versionData && mainDocument) {
      return { ...mainDocument, documentStructure: versionData.documentStructure };
    }
    return mainDocument;
  }, [mainDocument, versionData]);

  if (isLoadingMain) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (mainError || !displayDocument) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ErrorMessage message="Document not found" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-y-auto p-8 relative">
        {isLoadingVersion && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex justify-center items-center z-10">
            <LoadingSpinner />
          </div>
        )}
        <DocumentViewer document={displayDocument} />
      </div>
      <VersionHistoryPanel
        documentId={id!}
        onSelectVersion={handleSelectVersion}
        selectedVersionId={selectedVersionId}
      />
    </div>
  );
}
