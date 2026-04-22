## ADDED Requirements

### Requirement: Account-group schema support

Database migrations SHALL persist account groups and nullable account-to-group membership.

#### Scenario: Upgrade creates account-group storage

- **WHEN** the database is migrated to a revision that includes account groups
- **THEN** it creates an `account_groups` table for persisted group records
- **AND** it adds a nullable `accounts.account_group_id` foreign key referencing `account_groups.id`

#### Scenario: Deleting a group preserves accounts

- **WHEN** a persisted account group is deleted
- **THEN** the database keeps the related account rows
- **AND** it clears their `account_group_id` value instead of deleting the accounts
