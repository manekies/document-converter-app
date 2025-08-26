import React from "react";

interface Props {
  html: string;
}

export function DiffViewer({ html }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
