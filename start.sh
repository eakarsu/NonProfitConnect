#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DATABASE_URL:?DATABASE_URL must point to a dedicated PostgreSQL database}"
: "${SESSION_SECRET:?SESSION_SECRET is required}"

if (( ${#SESSION_SECRET} < 32 )); then
  echo "SESSION_SECRET must contain at least 32 characters" >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Dependencies are absent. Run 'npm ci' explicitly before startup." >&2
  exit 1
fi

api_port="${BACKEND_PORT:-${PORT:-3001}}"
ui_port="${FRONTEND_PORT:-3000}"
for assigned_port in "$api_port" "$ui_port"; do
  if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $assigned_port is already in use; refusing to terminate another process." >&2
    exit 1
  fi
done

if [[ "${MIGRATE_ON_START:-0}" == "1" || "${MIGRATE_ON_START:-false}" == "true" ]]; then
  npm run db:push -- --force
  npm run db:migrate:governed
fi

npx tsx server/provisionAdmin.ts

PORT="$api_port" npm run dev & app_pid=$!
trap 'kill "${app_pid:-}" "${proxy_pid:-}" 2>/dev/null || true; wait "${app_pid:-}" "${proxy_pid:-}" 2>/dev/null || true' INT TERM EXIT
for attempt in {1..480}; do curl -sS "http://127.0.0.1:$api_port/api/health" >/dev/null 2>&1 && break; kill -0 "$app_pid" 2>/dev/null||{ wait "$app_pid"||true; echo "Application exited before startup" >&2; exit 1; }; sleep 0.25; done
curl -fsS "http://127.0.0.1:$api_port/api/health" >/dev/null||{ echo "Application did not become ready" >&2; exit 1; }
RUNTIME_PROXY_PORT="$ui_port" RUNTIME_PROXY_TARGET_PORT="$api_port" node "$project_dir/_runtime-proxy.mjs" & proxy_pid=$!
wait "$app_pid" "$proxy_pid"
