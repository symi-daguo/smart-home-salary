#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./infra/backup/backup.sh /path/to/backup-dir
#
# Notes:
# - This script assumes you run it on the Docker host with access to the compose project.
# - It creates:
#   - Postgres dump (custom format): backups/pg/salary_<timestamp>.dump
#   - MinIO bucket mirror (objects): backups/minio/<bucket>/
#
# Requirements:
# - docker

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${1:-$ROOT_DIR/backups}"
TS="$(date -u +"%Y%m%dT%H%M%SZ")"
RETENTION_DAYS="${RETENTION_DAYS:-35}"

mkdir -p "$BACKUP_DIR/pg" "$BACKUP_DIR/minio"

echo "[1/2] Backing up Postgres..."
docker exec -i salary_postgres pg_dump \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-salary}" \
  -F c \
  -f "/tmp/salary_${TS}.dump"

docker cp "salary_postgres:/tmp/salary_${TS}.dump" "$BACKUP_DIR/pg/salary_${TS}.dump"
docker exec -i salary_postgres rm -f "/tmp/salary_${TS}.dump"
echo "Postgres dump: $BACKUP_DIR/pg/salary_${TS}.dump"

echo "[2/2] Backing up MinIO bucket objects..."
BUCKET="${S3_BUCKET:-salary-uploads}"

# Use minio/mc container to mirror objects out
docker run --rm \
  --network "container:salary_minio" \
  -e "MC_HOST_local=http://${MINIO_ROOT_USER:-minioadmin}:${MINIO_ROOT_PASSWORD:-minioadmin}@127.0.0.1:9000" \
  -v "$BACKUP_DIR/minio:/backup" \
  minio/mc:RELEASE.2025-01-17T23-25-50Z \
  mirror --overwrite "local/${BUCKET}" "/backup/${BUCKET}"

echo "MinIO mirror: $BACKUP_DIR/minio/${BUCKET}"

echo "[cleanup] Pruning old backups (RETENTION_DAYS=${RETENTION_DAYS})..."
# Keep only recent dumps to avoid disk growth. Default: ~5 weeks.
if command -v find >/dev/null 2>&1; then
  find "$BACKUP_DIR/pg" -type f -name 'salary_*.dump' -mtime +"$RETENTION_DAYS" -delete || true
fi
echo "Prune done."
echo "Done: $TS"

