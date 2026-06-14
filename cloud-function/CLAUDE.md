# CLAUDE.md — Cloud Function

This file provides guidance to Claude Code (claude.ai/code) when working in `cloud-function/`. See the root [CLAUDE.md](../CLAUDE.md) for the overall architecture.

## What this is

A single Google Cloud Function (functions-framework) that is the **only imperative backend code** in the project. It serves two roles for Hasura — **auth webhook** and **action handler** — plus public image asset serving. In dev it runs on `:8090`, fronted by nginx at `/api/internal` (private) and `/api/assets` (public).

## Request routing

One HTTP entry point, [src/index.ts](src/index.ts), routes by the first URL segment:

| Segment                       | Handler                          | Purpose                                          |
| ----------------------------- | -------------------------------- | ------------------------------------------------ |
| `authenticate-hasura-request` | `auth/authenticateHasuraRequest` | Hasura auth webhook — resolves session variables |
| `actions`                     | `actions.ts` → `handleActions`   | Hasura action handler (auth/user mutations)      |
| `events`                      | `events.ts` → `handleEvents`     | Hasura event triggers                            |
| `upload`                      | `images/upload`                  | Image upload                                     |
| `/images/*`                   | `images/download`                | Public image serving (resized/cached)            |
| `health`                      | inline                           | Health check (`🫛🌱🌳🍎`)                        |

## Auth model

- `handleActions` requires `validateBackendAuth` (the shared `CLOUD_FUNCTION_SECRET`) — actions are only callable by Hasura, not the public.
- Actions are dispatched by `body.action.name` to handlers in [src/auth/](src/auth/): `InsertUser`, `SignIn`, `SignOut`, `Me`, `ChangePassword`, `SendPasswordResetMail`, `ResetPassword`, `CreatePersonalAccessToken`.
- `forward_client_headers = true` is set in [../backend/metadata/actions.yaml](../backend/metadata/actions.yaml) only for actions that must know the current user (`Me`, `SignIn`, `SignOut`); the rest rely on Hasura permissions.
- The **first user** is created by running the `InsertUser` mutation against Hasura with the admin secret (see README).

## Layout

- [src/auth/](src/auth/) — one file per action + the validators (`validateBackendAuth`, `validateFrontendAuth`, `validatePersonalAccessToken`).
- [src/images/](src/images/) — `upload`, `download`, `cache`, `prune` (uses `sharp` for resizing, `@google-cloud/storage` for the bucket).
- [src/lib/](src/lib/) — shared helpers: `config` (env validation), `crypto`/`personalAccessToken` (`libsodium`, `jose`), `cookies`, `email` (`nodemailer`), `storage`, `rateLimited`, `errors`, `fetch`.
- `config.ts` **fails fast on startup** if any required env var is missing (`HASURA_GRAPHQL_URL/ADMIN_SECRET`, `CLOUD_FUNCTION_SECRET/URL`, `PASSWORD_RESET_*`, `EMAIL_*`). When adding config, add the validation there too.

## Commands

Copy env with `cp .env.example .env` (`HASURA_GRAPHQL_ADMIN_SECRET` and `CLOUD_FUNCTION_SECRET` must match the backend).

```bash
docker compose up --watch --build   # dev with file watching
npm run dev                          # nodemon + functions-framework on :8090
npm run build                        # tsc → dist/
./dev/test.sh                        # smoke test: signIn → query → signOut
```

This package uses **npm** (it has its own `package-lock.json`), unlike the frontend. Health: http://localhost:8090/health. Set `LOG_REQUESTS=true` in `.env` then restart (the `.env` is not watched) to log requests/responses.

Hasura only accepts 2xx/4xx responses from the function — error handling throws `ErrorWithStatus` with an appropriate code rather than 5xx.
