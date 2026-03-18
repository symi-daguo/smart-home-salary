#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR/infra"

echo "[1/4] docker compose up -d --build"
docker compose up -d --build

echo "[2/4] waiting api health..."
API_URL="${API_URL:-http://localhost:3000}"
WEB_URL="${WEB_URL:-http://localhost:5173}"

deadline=$((SECONDS + 180))
until curl -fsS "${API_URL}/api/health" >/dev/null 2>&1; do
  if (( SECONDS > deadline )); then
    echo "ERROR: api health not ready: ${API_URL}/api/health"
    echo "Tip: check logs: docker compose logs -n 200 api"
    exit 1
  fi
  sleep 2
done

echo "[3/4] basic endpoints..."
curl -fsS "${API_URL}/api/health" | sed 's/.*/health: &/'
curl -fsS -o /dev/null "${API_URL}/docs" && echo "swagger: ok" || (echo "swagger: failed" && exit 1)
curl -fsS -o /dev/null "${WEB_URL}/" && echo "web: ok" || (echo "web: failed" && exit 1)

echo "[4/4] done"
echo "OK"
