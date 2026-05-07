## Why

`backend.log` currently shows uvicorn access lines and a few structured proxy diagnostics, but it does not emit a paired request/response body trace for ordinary HTTP routes. During local development, that makes it harder to inspect normalized request payloads, upstream model-list fetches, docs responses, and local error responses without attaching an external proxy or debugger.

## What Changes

- Add an opt-in development logging mode that records HTTP request and response exchanges to the backend log.
- Log request id, method, path, status, duration, redacted headers, and a bounded body preview for both request and response.
- Preserve normal runtime behavior by keeping the feature disabled by default and truncating large payload previews.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `proxy-runtime-observability`: local operators can enable bounded HTTP exchange tracing for development debugging.

## Impact

- Affected code: `app/core/config/settings.py`, `app/core/middleware/`, and `app/main.py`.
- Adds regression coverage for JSON and streaming HTTP responses.
- Operational impact: developers can inspect request/response exchanges in `backend.log` without changing proxy behavior for normal runs.
