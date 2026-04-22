## Summary

This change introduces account groups as a persisted one-to-many relationship: one group can contain many accounts, and each account can belong to at most one group. The dashboard keeps using the existing overview payload shape for quotas and activity, but `AccountSummary` now includes group metadata so the frontend can derive grouped quota totals without a dedicated dashboard-group endpoint.

Request-log details move from an inline dialog to a route-backed page. The list API exposes a stable log identifier, and a new detail endpoint returns the full per-request payload needed by the detail page.

## Data Model

- Add `account_groups` with `id`, `name`, `created_at`, and `updated_at`
- Add nullable `accounts.account_group_id -> account_groups.id` with `ON DELETE SET NULL`
- Keep quota totals derived from existing usage snapshots; do not store group quota aggregates

## API Shape

### Account groups

- `GET /api/account-groups`
- `POST /api/account-groups`
- `PUT /api/account-groups/{group_id}`
- `DELETE /api/account-groups/{group_id}`

Create and update accept a group name plus the full list of assigned account IDs. Membership replacement is authoritative because an account can belong to only one group.

### Account summaries

`GET /api/accounts` and `GET /api/dashboard/overview` continue to return account summaries, but each account now includes:

- `accountGroupId`
- `accountGroupName`

The frontend uses those fields plus the existing window/account quota data to build grouped donut slices and grouped account cards.

### Request-log details

- `GET /api/request-logs` adds a stable `logId` field per row
- `GET /api/request-logs/{log_id}` returns the full detail payload for that specific entry

## UI Behavior

- Dashboard donut legends and account health cards render groups, not raw accounts.
- Accounts page shows a group rail, grouped quota summary, and member-account drill-down.
- Unassigned accounts appear in a synthetic `Ungrouped` group in the UI without needing a persisted row.
- Clicking a request log row or detail action navigates to a dedicated detail page that supports reload and browser navigation.
