## 1. Bridge Eviction

- [x] 1.1 Remove cached HTTP bridge sessions and aliases after unrecoverable websocket send failures.
- [x] 1.2 Remove cached HTTP bridge sessions and aliases after upstream terminal errors with HTTP status `>= 500`.
- [x] 1.3 Preserve existing retry behavior before eviction so recoverable bridge failures can still reconnect in-place.

## 2. Regression Coverage

- [x] 2.1 Add a regression test for `session_header` bridge send failure eviction.
- [x] 2.2 Add a regression test for upstream terminal 5xx eviction.

## 3. Verification

- [x] 3.1 Run targeted HTTP bridge unit tests for send failure, terminal 5xx, and reader error handling.
