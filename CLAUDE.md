# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

BreedersDB is a PWA for plant breeding (fruit trees): field data collection, plant trait assessment, and cross planning. It is a monorepo of independent services. **Per-service guidance lives in nested CLAUDE.md files — read the relevant one before working in that directory:**

- [frontend/CLAUDE.md](frontend/CLAUDE.md) — Quasar (Vue 3 + Vite + TS) PWA
- [backend/CLAUDE.md](backend/CLAUDE.md) — Hasura GraphQL over PostgreSQL
- [cloud-function/CLAUDE.md](cloud-function/CLAUDE.md) — Google Cloud Function (auth, authz, image assets)
- [print-bridge/CLAUDE.md](print-bridge/CLAUDE.md) — local printer HTTP service (mock + protocol)

This root file covers only what spans services.

## How the services fit together

In development, an nginx container ([backend/dev-nginx.conf](backend/dev-nginx.conf)) fronts everything on `localhost:80` and routes by path:

| Path                     | Target                 | Notes                                 |
| ------------------------ | ---------------------- | ------------------------------------- |
| `/api/hasura/console`    | Hasura console         | Backend admin UI                      |
| `/api/hasura/v1/graphql` | Hasura → Postgres      | The GraphQL API                       |
| `/api/internal`          | cloud-function `:8090` | Not public; called by Hasura for auth |
| `/api/assets`            | cloud-function `:8090` | Public; serves/handles images         |
| `/*`                     | frontend `:9200`       | The PWA                               |

The **print bridge** is the exception: it runs on the user's machine and the browser calls it directly (not via nginx).

### Auth flow (cross-service)

The cloud-function is Hasura's **auth webhook** and **action handler**. Hasura calls `/api/internal/authenticate-hasura-request` to resolve a session, and dispatches GraphQL actions (`SignIn`, `SignOut`, `Me`, `ChangePassword`, `InsertUser`, password reset, personal access tokens) to the cloud-function. The three services are coupled by shared secrets in their respective `.env` files — `HASURA_GRAPHQL_ADMIN_SECRET` and `CLOUD_FUNCTION_SECRET` must match across all three. The first user is created via the `InsertUser` mutation against Hasura with the admin secret.

### GraphQL type generation (cross-service)

The frontend's types are generated from the live Hasura schema with gql.tada. **Any backend schema change (migration or metadata) requires regenerating the frontend types** — run `bun --bun run graphql:output` in `frontend/` with the backend running. Stale generated types are the usual cause of frontend type errors after a backend change. The shared GraphQL config is [graphql.config.js](graphql.config.js).

### Domain model

Breeding entities form a hierarchy: `crossing` → `lot` → `cultivar` → `plant_group` → `plant` (plus `plant_row`, `orchard`, `rootstock`, `grafting`, `mother_plant`, `pollen`). Typed `attribute`s (boolean/date/decimal/integer/photo/rating/text/enum) are grouped into `attribution_form`s and recorded as `attribution`s against entities. The **Analyze** feature filters and aggregates attributions; it reads from the denormalized `cached_attributions` table. See [backend/docs/database.md](backend/docs/database.md) and the manual plan in [frontend/TESTING.md](frontend/TESTING.md).

## Repo-wide commands

```bash
bun install      # install root dev deps (Prettier/husky); each service installs separately
bun format       # Prettier across the whole repo
```

A husky pre-commit hook runs lint-staged (Prettier). Per-service install/build/test/lint commands are in each service's CLAUDE.md. CI workflows live in [.github/workflows/](.github/workflows/) (frontend check/test, backend test, DB UML, l10n).

## Setup order

Bring up the the **cloud-function** first, then the **backend** (Docker + `hasura metadata/migrate apply`), then the **frontend**. Details in each service's CLAUDE.md.
