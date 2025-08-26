"""
Minimal Python SDK for the Document Processing API
"""

from typing import Optional, Dict, Any
import requests
from urllib.parse import urlencode


class DocClient:
    def __init__(self, base_url: str, headers: Optional[Dict[str, str]] = None):
        self.base_url = base_url.rstrip("/")
        self.headers = headers or {}

    def upload(self, filename: str, mime_type: str, file_size: int) -> Dict[str, Any]:
        return self._post("/document/upload", {
            "filename": filename,
            "mimeType": mime_type,
            "fileSize": file_size
        })

    def process(self, document_id: str, mode: Optional[str] = None, quality: Optional[str] = None) -> Dict[str, Any]:
        body = {"documentId": document_id}
        if mode: body["mode"] = mode
        if quality: body["quality"] = quality
        return self._post(f"/document/{document_id}/process", body)

    def get_document(self, document_id: str) -> Dict[str, Any]:
        return self._get(f"/document/{document_id}")

    def list_documents(self, limit: Optional[int] = None, offset: Optional[int] = None) -> Dict[str, Any]:
        params = {}
        if limit is not None: params["limit"] = limit
        if offset is not None: params["offset"] = offset
        qs = f"?{urlencode(params)}" if params else ""
        return self._get(f"/documents{qs}")

    def convert(self, document_id: str, fmt: str, mode: str) -> Dict[str, Any]:
        return self._post("/document/convert", {
            "documentId": document_id,
            "format": fmt,
            "mode": mode
        })

    def list_outputs(self, document_id: str) -> Dict[str, Any]:
        return self._get(f"/document/{document_id}/outputs")

    def preview(self, document_id: str, mode: Optional[str] = None) -> Dict[str, Any]:
        qs = f"?{urlencode({'mode': mode})}" if mode else ""
        return self._get(f"/document/{document_id}/preview{qs}")

    def metrics_dashboard(self) -> Dict[str, Any]:
        return self._get("/metrics/dashboard")

    def _get(self, path: str) -> Dict[str, Any]:
        r = requests.get(f"{self.base_url}{path}", headers=self.headers)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, body: Dict[str, Any]) -> Dict[str, Any]:
        r = requests.post(f"{self.base_url}{path}", json=body, headers={"Content-Type": "application/json", **self.headers})
        r.raise_for_status()
        return r.json()
