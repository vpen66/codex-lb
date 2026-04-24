## Why

Cached HTTP bridge sessions can become permanently unusable after an upstream websocket send failure or server-side terminal error. If the broken bridge remains indexed under a hard `session_header` key, clients that reuse the same conversation id repeatedly receive `502 upstream_unavailable` from the same stale upstream session until they start a new conversation.

## What Changes

- Evict HTTP bridge sessions from the local bridge cache after websocket send failures that cannot be retried on a fresh upstream.
- Evict HTTP bridge sessions after upstream terminal errors with HTTP status `>= 500`.
- Add regression coverage proving the broken `session_header` bridge key and continuity aliases are removed so the next request can create a fresh upstream bridge.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `responses-api-compat`: HTTP bridge cache entries no longer survive unrecoverable upstream bridge failures.

## Impact

- Affected code: `app/modules/proxy/service.py` and HTTP bridge unit tests.
- Affected APIs: `/v1/responses` and `/v1/chat/completions` when chat completions are mapped onto Responses.
- Operational impact: operators should see `http_bridge_event event=evict_upstream_failure` after unrecoverable bridge failures; subsequent requests with the same client conversation key should create a new upstream bridge instead of looping on the stale one.
