# BreederDB - Backend

GraphQL API for BreederDB, built with [Hasura](https://hasura.io/docs/latest).

## Getting Started

1. Install:

   - [Docker](https://www.docker.com/) with [Docker
     Compose](https://docs.docker.com/compose/)
   - [Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/)
   - [bun.sh](https://bun.sh/) (optional, for running tests)

1. Create `.env`:

   ```bash
   cp .env.example .env
   ```

1. Set `HASURA_GRAPHQL_ADMIN_SECRET` and `HASURA_GRAPHQL_JWT_SECRET` in `.env`.
   Ensure they match the `.env` of the frontend.

1. Run:

   ```bash
   docker-compose up -d
   hasura migrate apply
   hasura metadata apply
   ```

1. Visit [Hasura Console](http://localhost:8080/console) (admin secret in `.env`)

## Database & Schema

See [database.md](./docs/database.md).

## Tests

Test the GraphQL API with [bun.sh](https://bun.sh/)'s test runner
([jest](https://jestjs.io/) compatible). Uses a separate test database, which is
created / cleared by the test script.

```bash
./tests/run.sh
```
