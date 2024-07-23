# BreedersDB - Frontend

Web frontend for the BreedersDB, built with [quasar](https://quasar.dev/) using
the Quasar CLI with Vite and TypeScript.

## Getting Started

1. Start the backend (see [backend/README.md](/backend/README.md))

1. Install [bun](https://bun.sh) OR [node](nodejs.org) with [nvm](https://github.com/nvm-sh/nvm) and [yarn](https://yarnpkg.com/).

   > [!NOTE]
   > Support for bun is experimental. Currently node and yarn are recommended.

1. Create `.env`:

   ```bash
   cp .env.example .env.dev
   ```

1. Install the dependencies:

   ```bash
   bun install
   # or
   yarn
   ```

1. Start the frontend (development mode with hot reloading, etc.)

   ```bash
   bun --bun run dev
   # or
   yarn dev
   ```

### Lint the files

```bash
bun --bun lint
# or
yarn lint
```

### Build the app for production

```bash
bun run build
# or
yarn build
```

> [!WARNING]
> Weird things happen when you build with bun, so use yarn instead.
> If you really want to use bun, run `yarn build` first, bun should work
> afterwards.

> [!NOTE]
> Before deploying, you should also upload the sourcemaps to sentry.
> Use `yarn build:sentry` to build with sentry sourcemaps and upload them.

### Preview the app in production mode

```bash
bun run serve
# or
yarn serve
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

## Stack

- [Quasar](https://quasar.dev/) in [Quasar CLI with Vite](https://quasar.dev/start/quasar-cli) mode with [TypeScript](https://www.typescriptlang.org/)
- [qgl.tada](https://gql-tada.0no.co/) for graphql type generation
- [urql](https://commerce.nearform.com/open-source/urql/docs/) as graphql client
