## MODIFIED Requirements

### Requirement: Dashboard page

The Dashboard page SHALL display summary metric cards, primary and secondary usage donut charts with legends, grouped account health cards, and a recent requests table with filtering and pagination. Donut legends and account cards MUST aggregate by account group instead of rendering one item per account.

#### Scenario: Dashboard renders grouped quota legends

- **WHEN** multiple accounts share the same persisted group
- **THEN** the dashboard donut legends combine those accounts into one group item
- **AND** the displayed remaining quota for that group equals the sum of its member accounts for the corresponding window

#### Scenario: Dashboard renders an ungrouped bucket

- **WHEN** one or more accounts have no persisted group
- **THEN** the dashboard renders a visible `Ungrouped` item in grouped quota and grouped account sections

### Requirement: Accounts page

The Accounts page SHALL provide group-oriented account management. It MUST let operators create groups, edit group membership, browse accounts within a selected group, and drill into member-account details without losing existing import, add-account, pause, resume, delete, or re-authenticate flows.

#### Scenario: Create a group from the Accounts page

- **WHEN** an operator creates a new group and selects member accounts
- **THEN** the page persists the group
- **AND** the selected group becomes visible in the group list
- **AND** the selected accounts appear under that group

#### Scenario: Browse accounts within a group

- **WHEN** an operator selects a group in the Accounts page
- **THEN** the page shows the group's aggregated quota summary
- **AND** it renders the member accounts for that group
- **AND** the operator can still open account-specific details and actions for any member account

### Requirement: Request logs display fast-mode service tier
When a request log entry includes `service_tier`, the dashboard request-log API response MUST expose it and the recent-requests UI MUST render it alongside the model label.

#### Scenario: Fast-mode request log entry is visible
- **WHEN** a request log entry is recorded with `service_tier: "priority"`
- **THEN** the `GET /api/request-logs` response includes `serviceTier: "priority"`
- **AND** the dashboard recent-requests table renders the model label with the priority tier visible

### Requirement: Request log detail page

The frontend SHALL provide a route-backed request-log detail page so operators can inspect a specific log entry outside the recent-requests table context.

#### Scenario: Navigate from recent requests to detail page

- **WHEN** an operator opens request details from the recent-requests table
- **THEN** the app navigates to a dedicated request-log detail route
- **AND** the page fetches the selected log entry by its stable log identifier

#### Scenario: Reload request-log detail page

- **WHEN** the operator reloads the request-log detail route directly
- **THEN** the page still renders the selected log entry from the detail API
