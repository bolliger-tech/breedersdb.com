# BreedersDB - Frontend

Web frontend for the BreedersDB, built with [quasar](https://quasar.dev/) using
the Quasar CLI with Vite and TypeScript.

## Getting Started

1. Start the backend (see [backend/README.md](/backend/README.md))

1. Install [bun](https://bun.sh):

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

1. Install the dependencies:

   ```bash
   bun install
   ```

1. Start the frontend (development mode with hot reloading, etc.)

   ```bash
   bun --bun run quasar dev
   ```

### Lint the files

```bash
bun --bun lint
```

### Build the app for production

```bash
bun run quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

## Stack

- [Quasar](https://quasar.dev/) in [Quasar CLI with Vite](https://quasar.dev/start/quasar-cli) mode with [TypeScript](https://www.typescriptlang.org/)
- [qgl.tada](https://gql-tada.0no.co/) for graphql type generation
- [urql](https://commerce.nearform.com/open-source/urql/docs/) as graphql client
