# BreederDB - Backend

GraphQL API for BreederDB, built with [Hasura](https://hasura.io/docs/latest).

## Getting Started

1. Install:

   - [Docker](https://www.docker.com/) with [Docker
     Compose V2](https://docs.docker.com/compose/)
   - [Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/)
   - [bun.sh](https://bun.sh/) (optional, for running tests)

1. Create `.env`:

   ```bash
   cp .env.example .env
   ```

1. Set `HASURA_GRAPHQL_ADMIN_SECRET` in `.env`. Ensure it matches the `.env` of the frontend. Also set `ACTIONS_SECRET` and ensure it matches the `.env` of the cloud-function.

1. Run:

   ```bash
   docker-compose up -d
   hasura metadata apply
   hasura migrate apply
   hasura metadata apply
   ```

1. Visit [Hasura Console](http://localhost/api/hasura/console) (admin secret in `.env`)

1. Run the [cloud-function](../cloud-function/README.md) for authentication to work (not needed if you only run queries with the admin-secret).

## Database & Schema

See [database.md](./docs/database.md).

## Tests

Test the GraphQL API with [bun.sh](https://bun.sh/)'s test runner
([jest](https://jestjs.io/) compatible). Uses a separate test database, which is
created / cleared by the test script.

```bash
# regular test run
./tests/run.sh

# reuse the test database
./tests/run.sh --quick

# help
./tests/run.sh --help
```
