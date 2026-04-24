## MODIFIED Requirements

### Requirement: Usage refresh reconciles recoverable quota states

Successful background usage refresh MUST reconcile recoverable account statuses using the fresh usage payload it just fetched and MUST persist status recovery without waiting for a later request-path selection pass.

#### Scenario: Background refresh clears quota exceeded after trusted recovery
- **GIVEN** an account is persisted as `quota_exceeded`
- **AND** its persisted block marker cooldown has elapsed
- **WHEN** background usage refresh fetches a fresh governing secondary-window usage snapshot whose usage is below exhaustion
- **THEN** the refresh persists the account as `active`
- **AND** it clears the stale `reset_at` and `blocked_at` markers

#### Scenario: Background refresh keeps quota exceeded during debounce
- **GIVEN** an account is persisted as `quota_exceeded`
- **AND** its persisted block marker cooldown has not elapsed yet
- **WHEN** background usage refresh fetches a fresh governing secondary-window usage snapshot whose usage is below exhaustion
- **THEN** the refresh keeps the account in `quota_exceeded`
- **AND** it does not clear the persisted block marker yet
