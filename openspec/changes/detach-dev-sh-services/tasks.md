## 1. Spec
- [x] 1.1 Add a local-development-workflow delta that defines detached `dev.sh` services.

## 2. Implementation
- [x] 2.1 Update `scripts/dev.sh` so backend and frontend processes are detached from the launching terminal session.
- [x] 2.2 Preserve log redirection and PID tracking for `status` and `stop`.
- [x] 2.3 Make `start` recover from a partial stale PID state before relaunching services.

## 3. Validation
- [ ] 3.1 Verify `./scripts/dev.sh start`, `status`, and `stop` continue to work with detached services.
- [x] 3.2 Validate specs locally with `openspec validate --specs` or record why it could not be run.

Note: `openspec` CLI is unavailable in the current shell (`openspec: command not found`), so spec validation could not be executed in-session.
