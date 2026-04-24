## ADDED Requirements

### Requirement: HTTP bridge sessions recover after unrecoverable upstream failures
When an HTTP bridge session becomes unusable because of an unrecoverable upstream transport failure or server-side terminal failure, the service MUST remove the affected bridge session from local cache indexes before serving later requests with the same bridge key. The service MUST allow the next request for that key to create a fresh upstream bridge instead of reusing the failed session.

#### Scenario: send failure evicts the cached bridge session
- **WHEN** an HTTP bridge request using a hard `session_header` key cannot send to the upstream websocket
- **AND** retrying the request on a fresh upstream is not possible or fails
- **THEN** the service removes the bridge session from the local bridge cache
- **AND** it removes local continuity aliases for that bridge session
- **AND** a later request with the same `session_header` key is not routed to the failed upstream websocket

#### Scenario: upstream terminal 5xx evicts the cached bridge session
- **WHEN** an HTTP bridge session receives an upstream terminal error event with HTTP status `>= 500`
- **THEN** the service removes the bridge session from the local bridge cache
- **AND** it removes local continuity aliases for that bridge session
- **AND** a later request with the same bridge key can create a fresh upstream bridge
