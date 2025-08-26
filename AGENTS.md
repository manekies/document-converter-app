> Purpose: give AI coding agents a compact, predictable, and actionable reference so they can build, test, and modify the document-converter-app repository without needing repeated hand-holding.

---

## 1 — Very short summary

This monorepo implements a full-stack document conversion pipeline: upload images → OCR (Tesseract / docTR / cloud providers) → LLM post‑processing for structure → exporters (DOCX / PDF / HTML / MD / TXT). Backend uses Encore; frontend is React + Vite + Tailwind. The orchestrator routes between OCR/LLM providers and supports local fallback.

When an agent reads this file, assume:

* You have repository checked out at project root.
* You have `encore` CLI installed and `bun` available per the project README.

---

## 2 — Setup & quick dev commands

Run these before changing code or running tests.

```bash
# install deps (repo uses bun as configured)
bun install

# run backend (service-oriented dev) — runs the Encore dev server
encore run

# run frontend locally
bun run --filter frontend dev

# run unit tests for whole monorepo
bun test

# run the specific test suite
bun run --filter backend test
```

If the repo has a generated client step, run `encore gen client` after backend starts.

---

## 3 — File map: what to open first

* `services/document/src/...` — orchestrator/router.ts, processors, exporters
* `services/document/src/orchestrator/*` — provider selection & fallback logic
* `services/document/src/exporters/*` — DOCX / PDF / HTML / Markdown
* `frontend/*` — React app, upload UI, preview/edit components
* `packages/sdk-js` & `packages/sdk-py` — example clients
* `openapi.json` — API surface (useful for clients & tests)
* `tests/*` — unit tests; add integration/E2E here

---

## 4 — Conventions & style

* TypeScript strict mode; prefer `unknown` + validation over `any`.
* Use `zod` (or the project validator) for incoming API payloads.
* Error handling with `APIError` pattern (service layer returns typed errors).
* Side-effectful jobs (OCR/LLM/convert) should be moved to background flows; agents should not add blocking work to API handlers.

---

## 5 — Environment & secrets (local/dev/prod)

Required environment variables / secrets (examples):

* `DATABASE_URL` — Postgres connection string
* `S3_ENDPOINT`, `S3_BUCKET`, `S3_KEY`, `S3_SECRET` — object store
* `DOC_TRENDPOINT` — (optional) HTTP base URL to a docTR inference endpoint
* `DOC_TRTOKEN` — (optional) API token/bearer token for docTR endpoint
* `ROBOFLOW_API_KEY` — (optional) Roboflow API key (if using Roboflow hosted inference)
* `OPENAI_API_KEY` / `GEMINI_API_KEY` / `GROQ_API_KEY` — LLM provider keys

**Important:** treat all provider keys as secrets. Use Encore secrets manager in each environment. Never commit keys.

---

## 6 — How the orchestrator picks OCR/LLM (quick rules)

* `mode=auto|local|cloud` controls preference. `auto` prefers cloud provider (if key present) and falls back to local Tesseract.
* `quality=fast|best` influences whether LLM postprocessing is applied; `best` runs an LLM refinement step.
* Each provider adapter must return a normalized `DocumentStructure` with text, type tokens (heading, paragraph, list, table), and bounding boxes for the `exact` mode.

When editing orchestrator logic, add unit tests for provider selection, and a health-check mock to assert fallbacks trigger on failures.

---

## 7 — Key endpoints to exercise during testing

* `POST /document/upload` — returns signed URL
* `POST /document/:documentId/process` — triggers a processing run
* `GET /document/:id/preview` — HTML preview
* `POST /document/convert` — format conversion
* `POST /documents/batch/process` and `STREAM /documents/batch/stream` — bulk flows

Write automated tests that perform: upload → simulate signed upload (or use local file storage) → call `process` → poll processing runs → call `convert`.

---

## 8 — Agent tasks & recommended prompts

Use these high-level tasks and prompts when asking an agent to make changes.

### Task: Add a new OCR provider adapter

Prompt template (short):

```
Add a new provider adapter at services/document/src/providers/newProvider.ts. The adapter must:
  - implement `detectLanguage`, `runOCR(imagePath) -> OCRResult` and `healthCheck()`
  - normalize output to existing `DocumentStructure` (text blocks + bbox + confidence)
  - integrate with orchestrator routing and expose provider metrics
Write unit tests that stub HTTP calls and assert normalization.
```

### Task: Harden retries on provider errors

```
Add an exponential backoff retry wrapper used by the orchestrator when calling cloud providers. Use a config flag `MAX_RETRIES` and a circuit-breaker that disables the provider for N minutes after M consecutive failures. Add unit tests that simulate failures and ensure fallback provider is selected.
```

### Task: Add an E2E test for batch processing

```
Add a Playwright/E2E test that creates a document, uploads sample images (fixtures), runs the batch process, asserts streaming events contain `queued -> processing -> converting -> completed`, and verifies exported file presence in the configured bucket (mock or local store).
```

---

## 9 — Testing & CI guidance

* Keep unit tests fast and deterministic: mock network providers for OCR/LLM.
* Add integration tests that run with a local object store (e.g., MinIO) and a local DB (SQLite/Postgres in a container).
* Add an E2E flow in CI (can be opt-in) that uses small fixtures to validate the full upload->process->convert path.

Recommended CI steps:

1. Install deps & typecheck
2. Run unit tests
3. Run integration tests (containerized DB & MinIO)
4. Smoke test a small conversion (if keys provided via CI secrets)

---

## 10 — Observability / metrics

Tag metrics by `provider` (Tesseract, docTR, Roboflow, OCR.space), `mode`, and `quality`. Track:

* request count
* avg latency (p50/p95/p99)- processing duration per run
* provider error rates
* CER/WER for sampled runs (attach expected outputs in `tests/fixtures/ground-truth`)

---

## 11 — Security / privacy guidance for agents

* Never leak secrets in logs or test fixtures. Use fake keys in tests.
* Add a `--no-cloud` dev flag to force local-only processing (no external provider calls). Agents should use this flag when running in CI without provider keys.
* For user data, implement retention policy and an S3 lifecycle rule; clearly mark UI when cloud providers are used.

---

## 12 — How to configure DocTR / docTR-style endpoints (DOC\_TREndpoint & DOC\_TRToken)

* `DOC_TREndpoint` is an HTTP(S) base URL that accepts image or PDF inputs and returns OCR results (ideally with bounding boxes). It can point to a hosted Roboflow workflow, a self-hosted docTR server, or any docTR-compatible inference server.
* `DOC_TRToken` is the bearer token or API key used to authenticate to that endpoint.

Examples for local/dev:

```bash
# use a local inference server running on port 9001
export DOC_TREndpoint=http://localhost:9001
export DOC_TRToken=local-dev-token
```

Change the orchestrator adapter to place `Authorization: Bearer ${DOC_TRToken}` in requests and to interpret the returned JSON format used by your chosen server.

---

## 13 — Roboflow (hosted) — quick integration notes (free tier)

Roboflow can host inference for models and expose an HTTP endpoint. You can use a Roboflow-hosted endpoint instead of a self-hosted docTR server. Typical flow:

1. Create a free Roboflow account and either use a public model from Roboflow Universe or train/upload a simple OCR model.
2. Generate an API key in the Roboflow dashboard (Workspace → Settings → API Keys).
3. Use the hosted inference base URL (e.g., `https://detect.roboflow.com` or the hosted workflow URL) and pass the API key in the request body or as a bearer header.

Sample HTTP (hosted) request skeleton — adjust `workflow` path to the hosted workflow/model you want to use:

```bash
curl --location 'https://detect.roboflow.com/infer/workflows/<your-workspace-name>/<your-workflow-id>' \
  --header 'Content-Type: application/json' \
  --data '{
    "api_key": "<YOUR-API-KEY>",
    "inputs": {
      "image": {"type": "url", "value": "https://example.com/scan1.jpg"}
    }
  }'
```

When using Roboflow as `DOC_TREndpoint`, point `DOC_TREndpoint` to `https://detect.roboflow.com` and set `DOC_TRToken` to your Roboflow API key. Update the docTR adapter to call the Inference workflow endpoint and normalize the response into `DocumentStructure`.

---

## 14 — Prompts & LLM guidance for agents

Keep LLM prompts minimal and deterministic. Use few-shot examples for converting OCR artifacts into structured headings/lists/tables. Prefer system instructions like:

```
System: You convert OCR text + bounding boxes into a JSON `DocumentStructure` with nodes: {type, text, bbox, confidence}.
Example: <small examples here>
```

Always include a max token/timeout in LLM calls and validate outputs with a schema (fail-safe to `editable` mode if the LLM output is invalid).

---

## 15 — Troubleshooting checklist (fast)

* **Uploads fail:** verify signed URL generation and CORS bucket policy.
* **Processing hangs:** check worker logs, provider health-check endpoint, and DB migrations.
* **Bad OCR:** capture original image + OCR output, run local Tesseract debug with `tesseract image.png stdout -l eng --psm 1`.
* **LLM hallucination:** add conservative validators and reduce reliance on LLM for structural decisions.

---

## 16 — PR & contribution guidelines for agents

* Run unit tests and linters before submitting.
* Add tests that fail prior to your change and pass afterwards.
* Include short description in PR body: change summary, testing steps, rollout plan.

---

## 17 — Useful commands & tips

* Jump to package quickly: `bunx turbo run where frontend` (or `where <package>` if turbo is configured).
* Regenerate typed client after API changes: `encore gen client`.

---

## 18 — What to document next (todo for humans/agents)

* Add E2E test plans and fixtures for different document types (multi-column, tables, handwritten).
* Add a `--no-cloud` simulation mode for CI.
* Document the exact JSON `DocumentStructure` schema in `openapi.json` and a downloadable sample.

---

## 19 — Feature Roadmap

This section outlines planned features and quality improvements for the document-converter-app. Contributions in these areas are welcome.

### Features

*   **Advanced Image Preprocessing Pipeline:** Implement a configurable pipeline for image enhancement steps like deskewing, noise reduction, and binarization before OCR.
*   **Smart Document Template Detection:** Automatically identify and apply predefined templates for recurring document layouts (e.g., invoices, receipts) to improve extraction accuracy.
*   **Collaborative Editing and Version Control:** Introduce features for multiple users to edit and comment on processed documents, with a history of changes.
*   **OCR Confidence-based Quality Assurance:** Use OCR confidence scores to flag low-confidence regions for manual review, creating a human-in-the-loop validation workflow.
*   **Advanced Table Reconstruction:** Improve table extraction logic to handle complex tables, including merged cells, nested tables, and borderless tables.
*   **Handwriting Recognition and Enhancement:** Integrate a handwriting recognition engine (e.g., using cloud APIs or specialized models) and tools to clean up handwritten text.

### Quality

*   **Comprehensive Error Handling and Retry Mechanisms:** Build robust error handling across all services, with configurable retry policies (e.g., exponential backoff) for external API calls.
*   **Memory Usage Optimization:** Profile and optimize memory consumption, especially during the processing of large documents or high-resolution images.
*   **Comprehensive Integration Tests:** Expand the test suite with more integration tests covering complex user flows and edge cases.
*   **Caching and Performance Optimization:** Implement caching strategies for frequently accessed data and optimize critical code paths to reduce processing latency.

---

*End of AGENTS.md.*
