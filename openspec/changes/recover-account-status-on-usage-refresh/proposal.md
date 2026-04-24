## Why

When an account is marked `quota_exceeded` or `rate_limited`, the background usage refresh currently writes new `usage_history` rows but does not reconcile `accounts.status`.

That leaves the dashboard showing stale exhausted states after quota usage has already recovered, unless a later load-balancer selection pass happens to recompute and persist the account state.

## What Changes

- Make successful background usage refresh reconcile recoverable account statuses against the fresh upstream usage payload.
- Preserve the existing quota debounce behavior by only clearing `quota_exceeded` or `rate_limited` after the governing post-block refresh is fresh enough to trust.
- Persist the recovered `active` status, clear stale `reset_at`, and clear stale `blocked_at` when refresh proves the account recovered.

## Impact

- Dashboard account status catches up as soon as usage refresh observes recovered quota.
- Recovery no longer depends on a later proxy selection pass.
- Existing fail-closed behavior for stale or missing post-block usage remains intact.
