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

#### Scenario: Dashboard group cards open from the full card surface

- **WHEN** an operator clicks anywhere on a dashboard group card
- **THEN** the app navigates to the Accounts page for that group
- **AND** the operator does not need to target a separate `Open Group` control

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

#### Scenario: Open account detail in a modal

- **WHEN** an operator selects a member account card in the Accounts page
- **THEN** the app opens that account's usage and token detail in a modal dialog
- **AND** the operator does not need to scroll below the member list to inspect the selected account

#### Scenario: Filter grouped accounts by status

- **WHEN** an operator applies an account status filter on the Accounts page
- **THEN** the page preserves the grouped layout
- **AND** it only renders groups that still contain at least one member account with the selected status
- **AND** each rendered group only lists member accounts that match the selected status

#### Scenario: Recover from an empty filtered state

- **WHEN** an operator applies a status filter that matches no accounts
- **THEN** the Accounts page keeps the filter controls visible
- **AND** the operator can switch back to another status without reloading the page

#### Scenario: Open an account from request logs

- **WHEN** an operator navigates to the Accounts page from a request-log account link
- **THEN** the page resolves the account's persisted group automatically
- **AND** it selects that account inside the group
- **AND** the usage/detail dialog renders the selected account instead of a different group member

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
