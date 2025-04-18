#!/bin/bash

# Dumps the selected database of the selected instance and imports it into the
# dev database.
# Usage: ./import-db.sh <instance> <db_name>
# Example: ./import-db.sh prod poc

set -euo pipefail

REMOTE_DB_INSTANCE=$1
REMOTE_DB_NAME=$2
REMOTE_DB_USER="postgres"
REMOTE_DB_HOST="localhost"
REMOTE_DB_PORT="35432"

LOCAL_DB_NAME="postgres"
LOCAL_DB_USER="postgres"
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_PASS="postgres"

SKRIPT_DIR="$(dirname $(realpath $0))"
BACKUP_DIR="/tmp"
BACKUP_PATH="${BACKUP_DIR}/breedersdb-pg-$REMOTE_DB_INSTANCE-$REMOTE_DB_NAME-$(date +%Y-%m-%dT%H%M%S).dump"

if [[ -z "$REMOTE_DB_INSTANCE" || -z "$REMOTE_DB_NAME" ]]; then
  echo "Usage: $0 <instance> <db_name>"
  exit 1
fi

if [[ "$REMOTE_DB_INSTANCE" == "prod" ]]; then
  echo "Importing $REMOTE_DB_NAME from $REMOTE_DB_INSTANCE to dev"
elif [[ "$REMOTE_DB_INSTANCE" == "staging" ]]; then
  echo "Importing $REMOTE_DB_NAME from $REMOTE_DB_INSTANCE to dev"
else
  echo "Invalid instance name. Use 'prod' or 'staging'."
  exit 1
fi

echo "This will overwrite the dev database. Are you sure? (y/n)"
read -r confirmation
if [[ "$confirmation" != "y" ]]; then
  echo "Aborting."
  exit 1
fi

echo "Starting cloud-sql-proxy..."
cloud-sql-proxy breedersdb:europe-west6:breedersdb-pg-$REMOTE_DB_INSTANCE --port $REMOTE_DB_PORT --gcloud-auth > /dev/null &
if ! pgrep -f "cloud-sql-proxy" > /dev/null; then
  echo "Failed to start cloud-sql-proxy. Exiting."
  exit 1
fi
echo "Cloud-sql-proxy started."
echo "Waiting for cloud-sql-proxy to be ready..."
while ! nc -z $REMOTE_DB_HOST $REMOTE_DB_PORT; do
  sleep 1
done
echo "Cloud-sql-proxy is ready."

echo "Dumping $REMOTE_DB_NAME from $REMOTE_DB_INSTANCE..."
pg_dump -h $REMOTE_DB_HOST -p $REMOTE_DB_PORT -U $REMOTE_DB_USER $REMOTE_DB_NAME --format=c --create > "$BACKUP_PATH"
echo "Dump completed. Backup saved to $BACKUP_PATH"

echo "Stopping cloud-sql-proxy..."
kill $(jobs -p)
echo "Cloud-sql-proxy stopped."

echo "Shutting down backend..."
docker-compose -f "$SKRIPT_DIR/backend/docker-compose.yaml" down
echo "Backend stopped."

echo "Starting local PostgreSQL server..."
docker-compose -f "$SKRIPT_DIR/backend/docker-compose.yaml" up -d postgres
echo "Local PostgreSQL server started."

echo "Waiting for local PostgreSQL server to be ready..."
while ! pg_isready -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER; do
  sleep 1;
done
echo "Local PostgreSQL server is ready."

echo "Dropping local database..."
PGPASSWORD=$LOCAL_DB_PASS dropdb -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER --if-exists $LOCAL_DB_NAME
echo "Local database dropped."

echo "Creating local database..."
PGPASSWORD=$LOCAL_DB_PASS createdb -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER --owner=$LOCAL_DB_USER --encoding=UTF8 --template=template0 --locale-provider=icu --icu-locale=en_US-u-kn-true $LOCAL_DB_NAME
echo "Local database created."

echo "Importing dump into local database..."
PGPASSWORD=$LOCAL_DB_PASS pg_restore -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME --no-owner --no-privileges "$BACKUP_PATH"
echo "Import completed."

echo "Starting backend..."
docker-compose -f "$SKRIPT_DIR/backend/docker-compose.yaml" up -d
echo "Backend started."

echo "Waiting for backend to be ready..."
while ! curl -s -f -o /dev/null http://localhost:8080/v1/graphql; do
  sleep 1;
done
echo "Backend is ready."

echo "Reloading hasura metadata..."
$(cd "$SKRIPT_DIR/backend" && hasura metadata reload --skip-update-check)
echo "Hasura metadata reloaded."

echo "Done."
