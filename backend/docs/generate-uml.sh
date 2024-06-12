#!/usr/bin/env bash

# Generate PlantUML diagram from the running database
# Usage: ./generate-puml.sh

set -euo pipefail

PG_DATABASE_URL="${PG_DATABASE_URL:-postgres://postgres:postgres@host.docker.internal:5432/postgres?sslmode=disable}"
base_dir=$(dirname $(realpath $0))

echo "Generating PlantUML diagram..."
docker run --add-host=host.docker.internal:host-gateway --rm -v \
  "$base_dir":/app $(docker build -q -f "$base_dir/planter.Dockerfile" "$base_dir") \
  planter \
  --output=/app/database.puml \
  --title="Database Schema" \
  --exclude="spatial_ref_sys" \
  "$PG_DATABASE_URL"

echo "Injecting colors..."
sed -i -E 's/entity "\*\*(crossings|lots|cultivars)\*\*"/entity "**\1**" #ffff0012 ##888800/g' "$base_dir/database.puml"
sed -i -E 's/entity "\*\*(plants|graftings|rootstocks|orchards|plant_rows)\*\*"/entity "**\1**" #0000ff12 ##000088/g' "$base_dir/database.puml"
sed -i -E 's/entity "\*\*(mother_plants|pollen)\*\*"/entity "**\1**" #0000ff06/g' "$base_dir/database.puml"
sed -i -E 's/entity "\*\*(attributions|attribute_values|attribution_form_fields|attributes|attribution_forms|attribute_types|attribute_data_types)\*\*"/entity "**\1**" #00ff0012 ##008800/g' "$base_dir/database.puml"

echo "Unescape formattings..."
sed -i -E 's/&#34;&#34;/""/g' "$base_dir/database.puml" # unescape text formatting (monospace)

# Wait for the file to be available to docker container
sleep 1

echo "Generating SVG images..."
docker run --rm -v "$base_dir":/app plantuml/plantuml:latest \
  -tsvg /app/database.puml \
  -o /app \
  && mv "$base_dir/database.svg" "$base_dir/database-light.svg"

# Wait for the file to be written to disk
sleep 1

docker run --rm -v "$base_dir":/app plantuml/plantuml:latest \
  -tsvg /app/database.puml \
  -darkmode \
  -o /app \
  && mv "$base_dir/database.svg" "$base_dir/database-dark.svg"

echo "done."
