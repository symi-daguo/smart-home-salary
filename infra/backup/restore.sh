#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./infra/backup/restore.sh /path/to/salary_YYYYmmddTHHMMSSZ.dump
#
# Notes:
# - This restores Postgres from a pg_dump custom-format file.
# - It overwrites existing data in target DB (drop + recreate schema objects).
# - Run on the Docker host with access to the compose project.

DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "Missing dump file. Example:"
  echo "  ./infra/backup/restore.sh ./backups/pg/salary_20260312T000000Z.dump"
  exit 1
fi

echo "[1/2] Restoring Postgres from dump: $DUMP_FILE"
docker cp "$DUMP_FILE" "salary_postgres:/tmp/restore.dump"

docker exec -i salary_postgres sh -lc "
  set -euo pipefail
  pg_restore -U \"\${POSTGRES_USER:-postgres}\" -d \"\${POSTGRES_DB:-salary}\" --clean --if-exists /tmp/restore.dump
  rm -f /tmp/restore.dump
"

echo "[2/2] Done."

