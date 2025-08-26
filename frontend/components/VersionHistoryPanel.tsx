import React, { useEffect, useState } from "react";
import client from "../client";
import { APIError } from "../client";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";

// This is a simplified type, as the full type is in the generated client.
// We only need a few fields for display.
interface VersionInfo {
  id: string;
  version_number: number;
  created_at: Date;
}

interface VersionHistoryPanelProps {
  documentId: string;
  onSelectVersion: (versionId: string) => void;
  selectedVersionId?: string;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ documentId, onSelectVersion, selectedVersionId }) => {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await client.document.listVersions({ documentId });
        // The response type from the client has a `versions` property
        setVersions(response.versions || []);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [documentId]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="border-l bg-gray-50 p-4" style={{ width: '250px' }}>
      <h3 className="text-lg font-semibold mb-4">Version History</h3>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!isLoading && !error && (
        <ul className="space-y-2">
          {versions.map((version) => (
            <li key={version.id}>
              <button
                onClick={() => onSelectVersion(version.id)}
                className={`w-full text-left p-2 rounded ${selectedVersionId === version.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              >
                <div className="font-medium">Version {version.version_number}</div>
                <div className="text-xs text-gray-500">{formatDate(version.created_at)}</div>
              </button>
            </li>
          ))}
          {versions.length === 0 && (
            <li className="text-sm text-gray-500">No versions found.</li>
          )}
        </ul>
      )}
    </div>
  );
};
