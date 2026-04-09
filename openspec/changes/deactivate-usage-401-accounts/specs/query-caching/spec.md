## ADDED Requirements

### Requirement: Usage refresh deactivates accounts only for explicit upstream deactivation signals
The background usage refresh flow MUST mark an account `deactivated` only when the upstream usage API returns an error that is both HTTP `401` and an explicit account-deactivated message, or another status already classified as a permanent deactivation signal.

#### Scenario: Transient usage 401 does not deactivate the account
- **WHEN** the usage refresh flow receives HTTP `401`
- **AND** the upstream error message does not explicitly indicate the account is deactivated
- **THEN** the account status remains unchanged
- **AND** the scheduler may retry again on a later refresh cycle

#### Scenario: Usage 401 with deactivated message deactivates the account
- **WHEN** the usage refresh flow receives HTTP `401`
- **AND** the upstream error message explicitly indicates the account has been deactivated
- **THEN** the account status is persisted as `deactivated`
- **AND** the deactivation reason includes the upstream usage error details

### Requirement: Background usage refresh skips deactivated accounts
The background usage refresh scheduler MUST NOT request the upstream usage API for accounts already marked `deactivated`.

#### Scenario: Scheduler sees a deactivated account
- **WHEN** the background usage refresh loop iterates across persisted accounts
- **AND** an account status is `deactivated`
- **THEN** the scheduler skips the upstream usage request for that account
