#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

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

app_port="${PORT:-3001}"
if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:"$app_port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $app_port is already in use; refusing to terminate another process." >&2
  exit 1
fi

if [[ "${APPLY_MIGRATIONS:-0}" == "1" ]]; then
  npm run db:migrate:governed
fi

if [[ "${SEED_DEMO_DATA:-0}" == "1" ]]; then
  if [[ "${NODE_ENV:-development}" == "production" ]]; then
    echo "Demo seed is forbidden in production." >&2
    exit 1
  fi
  npm run seed
fi

exec npm run dev
