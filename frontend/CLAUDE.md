# CLAUDE.md — Frontend

This file provides guidance to Claude Code (claude.ai/code) when working in `frontend/`. See the root [CLAUDE.md](../CLAUDE.md) for the overall architecture.

## What this is

The BreedersDB PWA: Quasar (Vue 3 + Vite + TypeScript) in Quasar CLI + Vite mode. urql GraphQL client, gql.tada for typed queries, vue-i18n, vue-router. Talks to Hasura at `/api/hasura/v1/graphql` and to the cloud-function at `/api/assets` (same origin via nginx in dev).

## Commands

Run scripts with **bun** (`bun --bun run <script>`), with two exceptions the project warns about: production builds and unit tests are unreliable under bun — use `yarn`/node there.

```bash
bun --bun run dev          # dev server, HMR, PWA mode; sets VITE_BDB_VERSION from git HEAD
bun --bun run lint         # eslint
bun --bun run tsc          # vue-tsc type check (no emit)
yarn run test:unit    # vitest (watch) — run with node, not bun
yarn run test:unit:ci # vitest run (single pass)
yarn build           # production build — use yarn; bun is flaky here
yarn build:sentry    # build + upload sourcemaps to Sentry (before deploy)
bun --bun run serve        # preview the production build on :9200
```

Requires the backend running first. Copy env with `cp .env.example .env.dev`.

## GraphQL is type-generated — regenerate after schema changes

Queries are written with `graphql()` from [src/graphql.ts](src/graphql.ts), which defines the custom scalar mappings (`date`, `float8`, `geography`, `citext`, `jsonb`, `timestamptz`, `uuid`). gql.tada infers types from the introspected schema, so after any backend migration/metadata change, with the backend running:

```bash
bun --bun run graphql:output   # regenerate gql.tada output (graphql-env.d.ts)
```

If types look stale or wrong after a backend change, this is almost always the fix.

## Layout

- [src/boot/](src/boot/) — Quasar boot files: `graphql-client.ts` (urql setup), `i18n.ts`, `sentry.ts`. App-wide init runs here.
- [src/router/](src/router/) — `routes.ts` + `index.ts`.
- [src/layouts/](src/layouts/) — `MainLayout` / `PageLayout` (authenticated) and `UnauthenticatedLayout`.
- [src/pages/](src/pages/) and [src/components/](src/components/) — organized by domain entity (Cultivar, Plant, Crossing, Attribute, Attribution, Analyze, …). The **Analyze** module is the most complex; its correctness is covered by the manual plan in [TESTING.md](TESTING.md).
- [src/composables/](src/composables/) and [src/utils/](src/utils/) — shared logic; prefer reusing these (e.g. `useEntityForm`, `useGetEntityById`, `attributeUtils`, `columnTypes`) over re-implementing.

## Printing

Label printing goes through [src/composables/print/](src/composables/print/): `usePrint` dispatches to either `useSystemPrint` (browser print) or `usePrintBridge`. The **print bridge** is a local HTTP service (default `localhost:3333`, configured in Settings) that the browser calls directly to send raw ZPL to network/USB label printers — `GET /printers`, `POST /print` with an `X-Printer-Id` header. See [../print-bridge/CLAUDE.md](../print-bridge/CLAUDE.md) for the protocol and a mock server.

## Testing

Unit tests are co-located with components as `*.vitest.test.ts` (vitest). The bulk of verification is manual end-to-end — see [TESTING.md](TESTING.md), which is the source of truth for Analyze/attribution behavior.

## Conventions

- i18n strings live in [src/i18n/](src/i18n/) (en-US, de-CH) and are managed via Crowdin (`crowdin.yml`); the repo's `l10n.yml` workflow syncs them.
- The PWA service worker lives in `src-pwa/`; mind the HMR quirk documented in the README.
