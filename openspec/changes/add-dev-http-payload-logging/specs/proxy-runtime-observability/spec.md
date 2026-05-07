## ADDED Requirements

### Requirement: Development HTTP exchange tracing is opt-in and bounded
When development HTTP exchange tracing is enabled, the system MUST emit paired request and response diagnostics for HTTP requests so operators can inspect the exchange in backend runtime logs without changing proxy behavior for normal runs.

#### Scenario: Enabled tracing records a JSON request and response
- **WHEN** the development HTTP exchange tracing setting is enabled
- **AND** an HTTP request reaches the FastAPI app
- **THEN** the backend log includes a request diagnostic with request id, method, path, redacted headers, and a bounded request body preview
- **AND** the backend log includes a matching response diagnostic with request id, method, path, status, duration, redacted headers, and a bounded response body preview

#### Scenario: Large or non-text payloads are bounded in logs
- **WHEN** development HTTP exchange tracing is enabled
- **AND** an HTTP request or response body is larger than the configured preview limit or is not safely representable as text
- **THEN** the backend log records a bounded preview or an omitted-body marker instead of the full payload
- **AND** sensitive authentication headers remain redacted in the emitted diagnostics
