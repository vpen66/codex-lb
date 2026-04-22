## 1. Implementation

- [x] 1.1 Add a query-caching spec delta for selective deactivation on usage-refresh 401 responses
- [x] 1.2 Update usage refresh logic to deactivate only for 401 responses whose message explicitly indicates deactivation
- [x] 1.3 Ensure already-deactivated accounts are skipped by background refreshes
- [x] 1.4 Add regression tests for transient 401 handling, deactivated-message 401 handling, and skip behavior
- [ ] 1.5 Validate OpenSpec and run targeted unit tests (`pytest` passed; `openspec` CLI is unavailable in this environment)
