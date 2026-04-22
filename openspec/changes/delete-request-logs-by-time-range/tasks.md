## 1. Spec

- [x] 1.1 Add request-log delete-by-range requirements
- [ ] 1.2 Validate OpenSpec changes (`openspec` CLI unavailable in this environment)

## 2. Tests

- [x] 2.1 Add backend integration coverage for deleting request logs by time range
- [x] 2.2 Add frontend dashboard coverage for the delete-range flow

## 3. Implementation

- [x] 3.1 Add `DELETE /api/request-logs` range deletion support with validation
- [x] 3.2 Add dashboard request-log delete controls and mutation handling
- [x] 3.3 Refresh dashboard request-log data after deletion
