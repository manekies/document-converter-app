CREATE TABLE processing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  ocr_provider TEXT NOT NULL,
  llm_provider TEXT,
  confidence DOUBLE PRECISION,
  text_length INTEGER,
  duration_ms INTEGER,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processing_runs_document_id ON processing_runs(document_id);
CREATE INDEX idx_processing_runs_created_at ON processing_runs(created_at);
