#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
STATE_DIR="$ROOT_DIR/codex-dev-log"
PID_FILE="$STATE_DIR/pids"
BACKEND_LOG_FILE="$STATE_DIR/backend.log"
FRONTEND_LOG_FILE="$STATE_DIR/frontend.log"

BLUE="$(printf '\033[1;34m')"
GREEN="$(printf '\033[1;32m')"
YELLOW="$(printf '\033[1;33m')"
RED="$(printf '\033[1;31m')"
RESET="$(printf '\033[0m')"

backend_pid=""
frontend_pid=""
follow_logs=0
backend_reload="${CODEX_LB_DEV_RELOAD:-0}"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/dev.sh start [--log] [reload|--reload|no-reload|--no-reload]
  ./scripts/dev.sh restart [--log] [reload|--reload|no-reload|--no-reload]
  ./scripts/dev.sh stop
  ./scripts/dev.sh status
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

load_nvm() {
  if command -v nvm >/dev/null 2>&1; then
    return
  fi

  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$nvm_dir/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    source "$nvm_dir/nvm.sh"
    return
  fi

  echo "nvm not found. Install nvm or export NVM_DIR before running this script." >&2
  exit 1
}

ensure_dirs() {
  mkdir -p "$STATE_DIR"
}

write_pid_file() {
  ensure_dirs
  cat >"$PID_FILE" <<EOF
backend_pid=$backend_pid
frontend_pid=$frontend_pid
EOF
}

load_pid_file() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 1
  fi

  # shellcheck disable=SC1090
  source "$PID_FILE"
}

is_pid_alive() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

remove_pid_file() {
  rm -f "$PID_FILE"
}

stop_pid_if_alive() {
  local pid="$1"
  if is_pid_alive "$pid"; then
    kill "$pid" 2>/dev/null || true
  fi
}

port_listener_pids() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
}

wait_for_port_to_close() {
  local port="$1"
  local attempts="${2:-20}"
  local attempt=1

  while [[ "$attempt" -le "$attempts" ]]; do
    if [[ -z "$(port_listener_pids "$port")" ]]; then
      return 0
    fi

    sleep 0.5
    attempt=$((attempt + 1))
  done

  return 1
}

stop_port_if_listening() {
  local port="$1"
  local label="$2"
  local pids

  pids="$(port_listener_pids "$port")"
  if [[ -z "$pids" ]]; then
    return 0
  fi

  echo "[dev] cleaning up $label listeners on port $port: $(echo "$pids" | tr '\n' ' ' | xargs)"
  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue
    kill "$pid" 2>/dev/null || true
  done <<<"$pids"

  if wait_for_port_to_close "$port" 10; then
    return 0
  fi

  pids="$(port_listener_pids "$port")"
  if [[ -z "$pids" ]]; then
    return 0
  fi

  echo "[dev] force stopping $label listeners on port $port: $(echo "$pids" | tr '\n' ' ' | xargs)"
  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue
    kill -9 "$pid" 2>/dev/null || true
  done <<<"$pids"

  wait_for_port_to_close "$port" 10
}

cleanup_start() {
  local exit_code=$?

  stop_pid_if_alive "$backend_pid"
  stop_pid_if_alive "$frontend_pid"

  wait "$backend_pid" 2>/dev/null || true
  wait "$frontend_pid" 2>/dev/null || true

  remove_pid_file
  exit "$exit_code"
}

log_prefixer() {
  local label="$1"
  local color="$2"
  awk -v label="$label" -v color="$color" -v reset="$RESET" \
    '{ printf "%s[%s]%s %s\n", color, label, reset, $0; fflush(); }'
}

start_backend() {
  local backend_args=(uv run fastapi run app/main.py --port 2455)
  if backend_reload_enabled; then
    backend_args+=(--reload)
  fi

  : >"$BACKEND_LOG_FILE"
  (
    cd "$ROOT_DIR"
    exec nohup "${backend_args[@]}" </dev/null >>"$BACKEND_LOG_FILE" 2>&1
  ) &
  backend_pid=$!
}

start_frontend() {
  nvm use 22 >/dev/null

  : >"$FRONTEND_LOG_FILE"
  (
    cd "$FRONTEND_DIR"
    exec nohup bun run dev </dev/null >>"$FRONTEND_LOG_FILE" 2>&1
  ) &
  frontend_pid=$!
}

wait_for_http() {
  local name="$1"
  local url="$2"
  local pid="$3"
  local log_file="$4"
  local max_attempts="${5:-60}"
  local attempt=1

  while [[ "$attempt" -le "$max_attempts" ]]; do
    if ! is_pid_alive "$pid"; then
      echo "${RED}[dev] $name failed to start. Check $log_file${RESET}" >&2
      return 1
    fi

    if curl --silent --show-error --fail "$url" >/dev/null 2>&1; then
      return 0
    fi

    sleep 1
    attempt=$((attempt + 1))
  done

  echo "${RED}[dev] timed out waiting for $name. Check $log_file${RESET}" >&2
  return 1
}

follow_log_files() {
  trap 'exit 0' INT TERM
  tail -n 20 -f "$BACKEND_LOG_FILE" "$FRONTEND_LOG_FILE" 2>/dev/null | awk \
    -v blue="$BLUE" -v green="$GREEN" -v reset="$RESET" \
    -v backend_log="$BACKEND_LOG_FILE" -v frontend_log="$FRONTEND_LOG_FILE" '
      BEGIN { current = "" }
      /^==> .* <==$/ {
        current = $0
        next
      }
      {
        if (current == "==> " backend_log " <==") {
          printf "%s[backend]%s %s\n", blue, reset, $0
          fflush()
        } else if (current == "==> " frontend_log " <==") {
          printf "%s[frontend]%s %s\n", green, reset, $0
          fflush()
        }
      }
    '
}

parse_start_args() {
  follow_logs=0
  backend_reload="${CODEX_LB_DEV_RELOAD:-0}"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --log)
        follow_logs=1
        ;;
      no-reload|--no-reload)
        backend_reload=0
        ;;
      reload|--reload)
        backend_reload=1
        ;;
      *)
        echo "Unknown start option: $1" >&2
        usage
        exit 1
        ;;
    esac
    shift
  done
}

backend_reload_enabled() {
  case "$(printf '%s' "$backend_reload" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on)
      return 0
      ;;
    0|false|no|off)
      return 1
      ;;
    *)
      echo "Invalid CODEX_LB_DEV_RELOAD value: $backend_reload" >&2
      exit 1
      ;;
  esac
}

cmd_start() {
  require_cmd uv
  require_cmd bun
  require_cmd curl
  load_nvm

  if [[ ! -d "$FRONTEND_DIR" ]]; then
    echo "Frontend directory not found: $FRONTEND_DIR" >&2
    exit 1
  fi

  if load_pid_file; then
    local backend_running=0
    local frontend_running=0

    if is_pid_alive "${backend_pid:-}"; then
      backend_running=1
    fi

    if is_pid_alive "${frontend_pid:-}"; then
      frontend_running=1
    fi

    if [[ "$backend_running" -eq 1 && "$frontend_running" -eq 1 ]]; then
      echo "${YELLOW}[dev] services already running${RESET}" >&2
      echo "backend pid=${backend_pid:-none} frontend pid=${frontend_pid:-none}"
      exit 1
    fi

    if [[ "$backend_running" -eq 1 || "$frontend_running" -eq 1 ]]; then
      echo "${YELLOW}[dev] found partial running state; cleaning up before start${RESET}"
      stop_pid_if_alive "${backend_pid:-}"
      stop_pid_if_alive "${frontend_pid:-}"
      wait "${backend_pid:-}" 2>/dev/null || true
      wait "${frontend_pid:-}" 2>/dev/null || true
      stop_port_if_listening 2455 "backend"
      stop_port_if_listening 5173 "frontend"
      remove_pid_file
    fi
  fi

  backend_pid=""
  frontend_pid=""
  remove_pid_file

  if backend_reload_enabled; then
    echo "[dev] starting backend on http://127.0.0.1:2455 with reload enabled"
  else
    echo "[dev] starting backend on http://127.0.0.1:2455 with reload disabled"
  fi
  start_backend
  write_pid_file

  if ! wait_for_http "backend" "http://127.0.0.1:2455/docs" "$backend_pid" "$BACKEND_LOG_FILE" 60; then
    cleanup_start
  fi

  echo "[dev] switching frontend to Node 22 with nvm"
  echo "[dev] starting frontend in $FRONTEND_DIR"

  start_frontend
  write_pid_file

  if ! wait_for_http "frontend" "http://localhost:5173" "$frontend_pid" "$FRONTEND_LOG_FILE" 60; then
    cleanup_start
  fi

  echo "${BLUE}[dev] backend ready: http://127.0.0.1:2455${RESET}"
  echo "${GREEN}[dev] frontend ready: http://localhost:5173${RESET}"
  echo "[dev] logs: $BACKEND_LOG_FILE"
  echo "[dev] logs: $FRONTEND_LOG_FILE"
  echo "${YELLOW}[dev] backend pid=$backend_pid frontend pid=$frontend_pid${RESET}"

  if [[ "$follow_logs" -eq 1 ]]; then
    echo "[dev] following logs. Press Ctrl+C to stop log streaming only."
    follow_log_files
  fi
}

cmd_stop() {
  if ! load_pid_file; then
    echo "[dev] no running services found"
    stop_port_if_listening 2455 "backend"
    stop_port_if_listening 5173 "frontend"
    exit 0
  fi

  local found_running=0
  if is_pid_alive "${backend_pid:-}"; then
    echo "[dev] stopping backend pid=${backend_pid}"
    stop_pid_if_alive "$backend_pid"
    found_running=1
  fi

  if is_pid_alive "${frontend_pid:-}"; then
    echo "[dev] stopping frontend pid=${frontend_pid}"
    stop_pid_if_alive "$frontend_pid"
    found_running=1
  fi

  if [[ "$found_running" -eq 0 ]]; then
    echo "[dev] no running services found"
  fi

  wait "${backend_pid:-}" 2>/dev/null || true
  wait "${frontend_pid:-}" 2>/dev/null || true

  stop_port_if_listening 2455 "backend"
  stop_port_if_listening 5173 "frontend"

  remove_pid_file
}

cmd_status() {
  if ! load_pid_file; then
    echo "[dev] stopped"
    exit 0
  fi

  local backend_state="stopped"
  local frontend_state="stopped"

  if is_pid_alive "${backend_pid:-}"; then
    backend_state="running (pid=${backend_pid})"
  fi

  if is_pid_alive "${frontend_pid:-}"; then
    frontend_state="running (pid=${frontend_pid})"
  fi

  echo "backend: $backend_state"
  echo "frontend: $frontend_state"
}

cmd_restart() {
  cmd_stop
  cmd_start
}

main() {
  local command="${1:-start}"

  case "$command" in
    start)
      shift
      parse_start_args "$@"
      cmd_start
      ;;
    restart)
      shift
      parse_start_args "$@"
      cmd_restart
      ;;
    stop)
      cmd_stop
      ;;
    status)
      cmd_status
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
