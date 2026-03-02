#!/bin/sh
set -e

# Creates additional databases needed by platform services.
# Idempotent: checks pg_database before creating.
# Env vars expected: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD

export PGPASSWORD="$POSTGRES_PASSWORD"
PSQL="psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres"

create_db_if_not_exists() {
  db_name="$1"
  exists=$($PSQL -tAc "SELECT 1 FROM pg_database WHERE datname = '$db_name'")
  if [ "$exists" = "1" ]; then
    echo "Database '$db_name' already exists, skipping."
  else
    echo "Creating database '$db_name'..."
    $PSQL -c "CREATE DATABASE \"$db_name\""
    echo "Database '$db_name' created."
  fi
}

create_db_if_not_exists "evolution"

echo "postgres-init: done."
