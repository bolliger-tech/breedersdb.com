#!/usr/bin/env bash

set -euo pipefail

postgresql_database=${POSTGRESQL_DATABASE:-test}
pgpassword=${PGPASSWORD:-postgres}

base_dir=$(dirname $(realpath $0))
quick=0
bun_args=()

YELLOW="\e[1;33m"
NC="\e[0m"

function usage() {
  cat << EOF
Usage:
  $0 [options]

Options:
  -h, --help  Show this help message and exit
  --quick     Skip environment setup and reuse the existing test environment
  *           Any other options are passed to 'bun test'

Description:
  This script runs the tests for the backend service. It sets up a test
  environment with a PostgreSQL database and a Hasura instance, applies the
  migrations, and runs the tests.

  The script can be run with the '--quick' option to skip the environment setup
  and reuse the existing test environment. This can be useful for running the
  tests multiple times without waiting for the environment to be set up each
  time. If the database schema has changed, or there are leftovers from previous
  runs, it is recommended to run the script without the '--quick' option.

  It is just a wrapper around the 'bun test' command, so all the options for
  that command can be passed to this script as well. See 'bun test --help' for
  more information.
EOF
}

function check_bash_version() {
  if [ "${BASH_VERSINFO[0]}" -lt 5 ]; then
    echo "ERROR: Bash 5 or later is required to run this script."
    exit 1
  fi
}

function check_bun_installed() {
  if ! command -v bun &> /dev/null; then
    echo "ERROR: 'bun' is not installed. See https://bun.sh/ for installation instructions."
    exit 1
  fi
}

function ensure_postgres_is_running() {
  cd "${base_dir}/.."

  if ! docker compose ps | grep -q postgres; then
    echo "Starting PostgreSQL..."
    POSTGRESQL_DATABASE=${postgresql_database} docker compose up -d postgres

    cat << EOF | timeout --foreground 30s sh
while ! docker compose exec -T postgres pg_isready -q -U postgres; do
  sleep 1
  echo "Waiting for PostgreSQL to be ready..."
done
EOF
  fi
}

function prepare_test_environment() {
  echo "Preparing test environment..."

  cd "${base_dir}/.."

  # starting cloud function
  docker compose --file="${base_dir}/../../cloud-function/docker-compose.yaml" up --build -d

  # stop hasura
  docker compose stop hasura

  # create or replace the test database
  cat << EOF | docker compose exec -T -e "PGPASSWORD=${pgpassword}" postgres sh
dropdb -h localhost -U postgres --if-exists ${postgresql_database}
createdb -h localhost -U postgres ${postgresql_database}
EOF

  # start hasura
  POSTGRESQL_DATABASE=${postgresql_database} docker compose up -d hasura

  # wait for hasura to be ready
  cat << EOF | timeout 30s bash
while ! curl -s -o /dev/null http://localhost:8080/healthz; do
  sleep 1
done
EOF

  # apply migrations
  hasura metadata apply # connect hasura to the database
  hasura migrate apply --all-databases
  hasura metadata apply # effectively apply the metadata

  # install dependencies
  echo "Installing dependencies..."
  cd "${base_dir}"
  bun install
}

function run_tests() {
  cd "${base_dir}"

  echo "Starting tests..."
  echo ""
  echo -e "${YELLOW}INFO${NC} Hasura will stay connected to the test database."
  echo "     To switch back to the regular database, run:"
  echo ""
  echo "     docker compose down hasura && docker compose up hasura -d"
  echo ""
  bun --env-file="${base_dir}/../.env" test "${bun_args[@]}"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0;;
    --quick) quick=1; shift 1;;
    *) bun_args+=("$1"); shift 1;;
  esac
done

check_bash_version
check_bun_installed
ensure_postgres_is_running

cd "${base_dir}/.."
if ! docker compose exec hasura bash -c '[[ "${PG_DATABASE_URL}" == */test ]]' \
  || [ ! -d "${base_dir}/node_modules" ] \
  || [ "$quick" -eq 0 ]; then
  prepare_test_environment
else
  echo -e "${YELLOW}INFO${NC} Reusing existing test environment..."
  echo -e "${YELLOW}INFO${NC} Run '$0' without '--quick' option to restart cleanly."
  echo
fi

run_tests
