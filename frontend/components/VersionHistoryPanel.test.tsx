import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import client from "../client";

// Mock the client
vi.mock("../client", () => ({
  default: {
    document: {
      listVersions: vi.fn(),
    },
  },
}));

describe("VersionHistoryPanel", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render a loading spinner initially", () => {
    (client.document.listVersions as any).mockReturnValue(new Promise(() => {})); // a promise that never resolves
    render(<VersionHistoryPanel documentId="doc1" onSelectVersion={mockOnSelect} />);
    expect(screen.getByRole("status")).toBeInTheDocument(); // Assuming LoadingSpinner has a role of status
  });

  it("should render a list of versions on successful fetch", async () => {
    const mockVersions = {
      versions: [
        { id: "v1", version_number: 2, created_at: new Date() },
        { id: "v2", version_number: 1, created_at: new Date() },
      ],
    };
    (client.document.listVersions as any).mockResolvedValue(mockVersions);

    render(<VersionHistoryPanel documentId="doc1" onSelectVersion={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("Version 2")).toBeInTheDocument();
      expect(screen.getByText("Version 1")).toBeInTheDocument();
    });
  });

  it("should call onSelectVersion when a version is clicked", async () => {
    const mockVersions = {
      versions: [{ id: "v1", version_number: 1, created_at: new Date() }],
    };
    (client.document.listVersions as any).mockResolvedValue(mockVersions);
    render(<VersionHistoryPanel documentId="doc1" onSelectVersion={mockOnSelect} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Version 1"));
    });

    expect(mockOnSelect).toHaveBeenCalledWith("v1");
  });
});
