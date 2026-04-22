## Why
Closing the terminal window that launched `./scripts/dev.sh start` currently tears down the local frontend process. The launcher starts `bun run dev` in the background, but it still inherits the terminal session and TTY, so Vite can receive a hangup or hit `read EIO` when the window closes. That makes the local development workflow fragile and forces developers to keep the original terminal open.

## What Changes
- Detach the `scripts/dev.sh` backend and frontend child processes from the launching terminal session.
- Ensure the detached services do not read from the closing TTY and continue writing to the existing log files.
- Keep the existing PID-file based `status` and `stop` workflow intact.

## Impact
- Affects the local developer launcher at `scripts/dev.sh`.
- No API or product behavior changes.
- Developers can close the terminal window after `./scripts/dev.sh start` without losing the local services.
