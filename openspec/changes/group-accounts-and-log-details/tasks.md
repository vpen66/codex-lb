## 1. Spec

- [x] 1.1 Add an `account-groups` capability spec covering group CRUD, single-group membership, and implicit ungrouped behavior
- [x] 1.2 Update `frontend-architecture` to require grouped dashboard/accounts views and a route-backed request-log detail page
- [x] 1.3 Update `database-migrations` to require persisted account-group storage and nullable account-to-group linkage

## 2. Backend

- [x] 2.1 Add `account_groups` persistence and `accounts.account_group_id` migration support
- [x] 2.2 Add account-group repository/service/API flows for list, create, update, and delete
- [x] 2.3 Extend account summary responses with `accountGroupId` and `accountGroupName`
- [x] 2.4 Add request-log row IDs to the list API and a detail endpoint for a single log entry

## 3. Frontend

- [x] 3.1 Redesign dashboard quota/account sections to aggregate by group
- [x] 3.2 Redesign the Accounts page around group browsing and group editing while preserving account import/add/action flows
- [x] 3.3 Add a request-log detail route and navigation from the recent-requests table
- [x] 3.4 Move member-account usage details into a modal dialog opened from the selected account card

## 4. Tests

- [x] 4.1 Add backend coverage for account-group CRUD and account-summary group fields
- [x] 4.2 Add backend coverage for request-log detail retrieval
- [x] 4.3 Update frontend mocks, schema tests, and integration tests for grouped dashboard/accounts flows and request-log detail navigation
- [x] 4.4 Update Accounts page integration coverage for modal account details
