#!/bin/bash

DB_TYPE=${1:-postgres}

if [ "$DB_TYPE" = "sqlite" ]; then
    echo "Switching to SQLite..."
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    cp .env.sqlite .env
    echo "Done! Using SQLite database."
else
    echo "Switching to PostgreSQL..."
    cp prisma/schema.postgres.prisma prisma/schema.prisma
    cp .env.postgres .env
    echo "Done! Using PostgreSQL database."
fi

echo "Running prisma generate..."
npx prisma generate

echo "Database switched successfully!"
