## ADDED Requirements

### Requirement: Request logs support delete by time range
The dashboard request-log surface MUST allow an operator to delete request logs within an explicit time range. The delete operation MUST require both range endpoints and MUST refresh the dashboard request-log data after success.

#### Scenario: Delete request logs within a selected range
- **WHEN** the operator submits a delete request with `since` and `until`
- **AND** `since` is earlier than or equal to `until`
- **THEN** the dashboard calls `DELETE /api/request-logs?since=...&until=...`
- **AND** the response includes the number of deleted rows
- **AND** the request-log table refreshes to reflect the deletion

#### Scenario: Reject invalid delete ranges
- **WHEN** the operator submits a delete request without both range endpoints
- **OR** `since` is later than `until`
- **THEN** the delete request is rejected with a dashboard bad-request error
- **AND** no request-log rows are deleted
