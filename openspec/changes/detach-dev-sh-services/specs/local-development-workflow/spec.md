## ADDED Requirements

### Requirement: dev.sh launches detached local services

The `scripts/dev.sh` launcher MUST start the local backend and frontend services in a way that survives closing the terminal window that invoked the script. The detached services MUST not continue reading from the original terminal TTY, and the launcher MUST continue recording their PIDs and logs so the existing `status` and `stop` commands remain usable.

#### Scenario: Launching services survives terminal closure

- **WHEN** a developer runs `./scripts/dev.sh start`
- **AND** the script reports healthy backend and frontend services
- **THEN** closing the original terminal window does not stop the launched backend or frontend processes

#### Scenario: Detached services still support status and stop

- **WHEN** `./scripts/dev.sh start` has launched detached services
- **THEN** `./scripts/dev.sh status` reports the recorded backend and frontend processes as running
- **AND** `./scripts/dev.sh stop` stops those processes and removes the PID file

#### Scenario: Partial PID state does not block relaunch

- **WHEN** the PID file exists
- **AND** only one of the recorded backend or frontend processes is still running
- **THEN** `./scripts/dev.sh start` stops the remaining partial process state
- **AND** the launcher starts a fresh backend and frontend pair instead of failing with "services already running"

### Requirement: dev.sh supports stable backend execution without Python reload

The `scripts/dev.sh` launcher MUST provide an explicit mode that starts the backend without FastAPI reload watching so developers can keep a stable local service running while editing Python files.

#### Scenario: Start without backend reload

- **WHEN** a developer runs `./scripts/dev.sh start --no-reload`
- **THEN** the launcher starts the backend without passing FastAPI's `--reload` option
- **AND** editing Python files does not automatically restart the running backend

#### Scenario: Restart without backend reload

- **WHEN** a developer runs `./scripts/dev.sh restart --no-reload`
- **THEN** the launcher restarts the local services
- **AND** the relaunched backend runs without FastAPI reload watching
