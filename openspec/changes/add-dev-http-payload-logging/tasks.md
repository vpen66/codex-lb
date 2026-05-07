## 1. HTTP Exchange Logging

- [x] 1.1 Add opt-in settings for HTTP exchange logging enablement and maximum preview bytes.
- [x] 1.2 Add middleware that logs request and response metadata plus bounded body previews with secret-bearing headers redacted.
- [x] 1.3 Wire the middleware into app startup without changing default runtime behavior.

## 2. Regression Coverage

- [x] 2.1 Add unit coverage for JSON request/response logging.
- [x] 2.2 Add unit coverage for streaming responses to confirm logging does not change the response body.

## 3. Verification

- [x] 3.1 Run targeted pytest coverage for the new middleware.
- [x] 3.2 Run `ruff` on the touched Python files.
