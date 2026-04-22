## ADDED Requirements

### Requirement: Persisted account groups

The system SHALL support persisted named account groups. A group MAY contain many accounts, and an account MUST belong to at most one persisted group at a time.

#### Scenario: Create a group with assigned accounts

- **WHEN** an operator creates an account group with a name and a list of account IDs
- **THEN** the system persists the group
- **AND** it assigns each listed account to that group
- **AND** each assigned account is removed from any previously assigned group

#### Scenario: Delete a group

- **WHEN** an operator deletes an account group
- **THEN** the group is removed
- **AND** the previously assigned accounts remain in the system
- **AND** those accounts become ungrouped

### Requirement: Group membership is visible in account summaries

Account summary responses MUST expose persisted group membership so clients can derive grouped views without extra per-account lookups.

#### Scenario: Grouped account summary

- **WHEN** an account belongs to a persisted group
- **THEN** the account summary includes `accountGroupId` and `accountGroupName`

#### Scenario: Ungrouped account summary

- **WHEN** an account does not belong to a persisted group
- **THEN** the account summary includes `accountGroupId = null`
- **AND** the account summary includes `accountGroupName = null`

### Requirement: Ungrouped accounts remain representable

Clients MUST be able to present accounts that do not belong to any persisted group as a synthetic ungrouped bucket.

#### Scenario: List groups when some accounts are unassigned

- **WHEN** at least one account has no persisted group
- **THEN** the persisted group APIs continue returning only persisted groups
- **AND** account summary responses still let the client derive an `Ungrouped` bucket for those accounts
