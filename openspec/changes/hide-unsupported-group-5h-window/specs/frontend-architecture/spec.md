## MODIFIED Requirements

### Requirement: Dashboard page

The Dashboard page SHALL display summary metric cards, primary and secondary usage donut charts with legends, grouped account health cards, and a recent requests table with filtering and pagination. Donut legends and account cards MUST aggregate by account group instead of rendering one item per account.

#### Scenario: Dashboard omits unsupported 5h group quota

- **WHEN** a persisted group contains only accounts whose summaries omit `windowMinutesPrimary`
- **THEN** the group's aggregated `5h Remaining` value excludes those accounts
- **AND** the group does not display a synthetic depleted 5-hour total derived from missing data

### Requirement: Accounts page

The Accounts page SHALL provide group-oriented account management. It MUST let operators create groups, edit group membership, browse accounts within a selected group, and drill into member-account details without losing existing import, add-account, pause, resume, delete, or re-authenticate flows.

#### Scenario: Group summary omits unsupported 5h quota

- **WHEN** a selected group contains only accounts whose summaries omit `windowMinutesPrimary`
- **THEN** the page's grouped `5h Remaining` summary excludes those accounts
- **AND** the page does not show a synthetic depleted 5-hour total derived from missing data
