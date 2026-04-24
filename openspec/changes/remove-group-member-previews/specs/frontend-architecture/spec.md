## MODIFIED Requirements

### Requirement: Dashboard page

The Dashboard page SHALL display summary metric cards, primary and secondary usage donut charts with legends, grouped account health cards, and a recent requests table with filtering and pagination. Donut legends and account cards MUST aggregate by account group instead of rendering one item per account.

#### Scenario: Dashboard group cards omit member previews

- **WHEN** the dashboard renders grouped account cards
- **THEN** each card shows group identity and quota summaries
- **AND** it does not render a member email preview block inside the card

### Requirement: Accounts page

The Accounts page SHALL provide group-oriented account management. It MUST let operators create groups, edit group membership, browse accounts within a selected group, and drill into member-account details without losing existing import, add-account, pause, resume, delete, or re-authenticate flows.

#### Scenario: Group summary header omits member snapshot

- **WHEN** an operator opens a selected group on the Accounts page
- **THEN** the summary header shows grouped quota information
- **AND** it does not render a member snapshot block above the member list
