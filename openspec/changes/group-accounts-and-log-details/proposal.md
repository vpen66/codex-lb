## Why

The dashboard and accounts pages currently scale linearly with the number of accounts. Once operators import many accounts, the usage donuts become unreadable, the account card grid becomes noisy, and the primary workflow shifts from understanding pool health to hunting for individual accounts in a crowded page.

Operators need a lightweight grouping model so they can organize accounts into named groups, see quota totals at the group level, and drill into the member accounts only when needed. Request logs also need a stable detail page so operators can inspect a specific log entry without relying on an inline dialog inside a paginated table.

## What Changes

- Add named account groups that operators can create, update, and delete from the dashboard UI.
- Allow each account to belong to at most one group; unassigned accounts remain visible under an implicit `Ungrouped` bucket in the UI.
- Extend account summary payloads so the dashboard can aggregate donut charts and account cards by group instead of rendering one item per account.
- Redesign the Accounts page around group management and grouped account browsing while preserving existing account import, OAuth add-account, and account action flows.
- Add a request-log detail route and API so operators can open a dedicated page for a specific log entry from the recent-requests table.

## Impact

- Specs: `frontend-architecture`, new `account-groups`, `database-migrations`
- Backend: new account-group persistence and API routes; account summary response contract; request-log detail API
- Frontend: dashboard grouping UI, grouped accounts page, request-log detail route, mocks, and tests
- Data model: new `account_groups` table and nullable account-to-group foreign key
