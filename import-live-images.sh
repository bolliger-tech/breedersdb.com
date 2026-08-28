#!/bin/bash

# Downloads the assets of the selected instance and imports them into the local
# fake-gcs-server (see cloud-function/docker-compose.yaml).
# Usage: ./import-live-images.sh <instance>
# Example: ./import-live-images.sh poc
#
# <instance> is the same name as the <db_name> of import-live-db.sh. Run both
# with the same instance to keep the images and the database in sync.

set -euo pipefail

INSTANCE=${1:-}

SKRIPT_DIR="$(dirname "$(realpath "$0")")"
COMPOSE_FILE="${SKRIPT_DIR}/cloud-function/docker-compose.yaml"

# see cloud-function/.env.example
FAKE_GCS_URL="http://localhost:4443"
LOCAL_BUCKET="dev-bucket"

REMOTE_BUCKET="${INSTANCE}-breedersdb-assets"
# stable path, so re-runs only download what changed
DOWNLOAD_DIR="/tmp/breedersdb-images-${INSTANCE}"
PARALLEL_UPLOADS=8

if [[ -z "$INSTANCE" ]]; then
  echo "Usage: $0 <instance>"
  exit 1
fi

if ! command -v gcloud &> /dev/null; then
  echo "gcloud could not be found, please install it to proceed."
  exit 1
fi

if ! gcloud storage buckets describe "gs://${REMOTE_BUCKET}" &> /dev/null; then
  echo "Bucket gs://${REMOTE_BUCKET} not found. Available instances:"
  gcloud storage buckets list --format="value(name)" \
    | sed -n 's/-breedersdb-assets$//p' \
    | sed 's/^/  /'
  exit 1
fi

echo "Importing images from $REMOTE_BUCKET to dev"
echo "This will overwrite the dev images. Are you sure? (y/n)"
read -r confirmation
if [[ "$confirmation" != "y" ]]; then
  echo "Aborting."
  exit 1
fi

echo "Starting fake-gcs-server..."
docker compose --file="$COMPOSE_FILE" up -d fake-gcs
echo "Waiting for fake-gcs-server to be ready..."
while ! curl -s -f -o /dev/null "${FAKE_GCS_URL}/storage/v1/b"; do
  sleep 1;
done
echo "Fake-gcs-server is ready."

# the cached-* derivates are regenerated on demand, no need to download them
echo "Downloading images from gs://${REMOTE_BUCKET}..."
mkdir -p "$DOWNLOAD_DIR"
gcloud storage rsync "gs://${REMOTE_BUCKET}" "$DOWNLOAD_DIR" \
  --exclude='cached-.*' \
  --delete-unmatched-destination-objects
echo "Download completed. Images saved to $DOWNLOAD_DIR"

# fake-gcs-server indexes the bucket at startup and ignores files that appear
# later, so the images have to be uploaded through its API. Emptying the bucket
# on disk is fine, as long as it is restarted before uploading.
echo "Emptying the dev bucket..."
docker compose --file="$COMPOSE_FILE" exec -T fake-gcs \
  sh -c "rm -rf /storage/${LOCAL_BUCKET}/*"
docker compose --file="$COMPOSE_FILE" restart fake-gcs
while ! curl -s -f -o /dev/null "${FAKE_GCS_URL}/storage/v1/b"; do
  sleep 1;
done
echo "Dev bucket emptied."

echo "Uploading images to the dev bucket..."
export FAKE_GCS_URL LOCAL_BUCKET
find "$DOWNLOAD_DIR" -type f -print0 \
  | xargs -0 -P $PARALLEL_UPLOADS -n 1 sh -c '
      name=$(basename "$0")
      curl -s -f -o /dev/null -X POST --data-binary "@$0" \
        -H "Content-Type: image/jpeg" \
        "${FAKE_GCS_URL}/upload/storage/v1/b/${LOCAL_BUCKET}/o?uploadType=media&name=${name}" \
        || { echo "Failed to upload ${name}"; exit 1; }
    '

imported=$(curl -s "${FAKE_GCS_URL}/storage/v1/b/${LOCAL_BUCKET}/o?fields=items(name)" \
  | grep -o '"name"' | wc -l | tr -d ' ')
echo "Import completed. $imported images in the dev bucket."

echo "Done."
