## Why

The dashboard request logs page currently supports filtering by time, but operators cannot remove old or noisy request-log rows from the UI. When the log table accumulates a large amount of historical data, debugging recent traffic becomes slower and retention cleanup requires direct database access.

## What Changes

- Add a dashboard request-log delete operation that removes rows within an explicit time range.
- Require the delete range to include both `since` and `until`, and reject inverted ranges.
- Add a Request Logs UI action that opens a delete-range dialog, submits the delete request, and refreshes the dashboard data after success.

## Impact

- Code: `app/modules/request_logs/*`, `frontend/src/features/dashboard/*`
- Tests: request-log API integration, dashboard integration/mocks, frontend handler coverage
- Specs: `openspec/specs/frontend-architecture/spec.md`
