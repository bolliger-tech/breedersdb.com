---
name: generate-e2e
description: Generate/extend frontend Playwright e2e specs via the coverage loop. Args:[next|<feature>] [count].
---

# generate-e2e

Grow the frontend e2e suite one feature at a time until
[frontend/e2e/COVERAGE.md](../../../frontend/e2e/COVERAGE.md) is all `done`.
**Read [frontend/CLAUDE.md](../../../frontend/CLAUDE.md) and the e2e section of
[frontend/TESTING.md](../../../frontend/TESTING.md) first** — they own the
stack and commands. This skill adds only the loop, the harness contract, and
the non-obvious gotchas.

**Arguments:** `[target] [count]`

- `target` — `next` (default): pick the first `todo`/`partial` row in
  COVERAGE.md, top to bottom. Or a feature name matching a row (e.g.
  `cultivars`, `analyze`); if ambiguous, ask.
- `count` — how many coverage rows to process this invocation (default 1).

## Pre-flight (every invocation)

1. Read `frontend/e2e/COVERAGE.md` and the `frontend/e2e/support/` helpers.
2. Verify the stack is up: `curl -sf http://localhost/`,
   `http://localhost/api/hasura/healthz`, `http://localhost/api/internal/health`.
   The frontend dev server intermittently dies on mass file changes (fsevents
   crash) — restart `bun --bun run dev` in `frontend/` before blaming a spec.
   A red vite-plugin-checker overlay (type/lint error in ANY file, including
   `e2e/**`) blocks all pointer events, so `bun --bun run tsc` must be clean
   or every click times out.
3. Establish the baseline: `cd frontend && bun run test:e2e` must be green
   before you change anything. If it is not, fix or report that first — never
   build on a red baseline.

## The loop (non-negotiable rules)

1. **One coverage row at a time.** Pick it, announce it, finish it (or mark it
   blocked) before touching the next.
2. **Read the page/component source before writing locators.** Follow the
   selector strategy in `e2e/support/locators.ts` (roles, pinned en-US label
   text, the documented CSS hooks). Never invent selectors from screenshots.
3. **Seed all data with the `seed` fixture** (`e2e/support/fixtures.ts`) —
   never depend on pre-existing rows. Entities the test creates through the UI
   must be registered with `seed.track(table, id)` or deleted through the UI
   within the test.
4. **Iterate on the new spec in isolation** until green:
   `bun run test:e2e -- <file>` (debug with `--trace on` and the html report,
   not guesswork). Then run the **full suite** to catch cross-test bleed.
5. **Green must mean something.** Assert the user-visible outcome (row
   appears, value renders, URL changes). Never weaken an assertion, add a
   retry-loop, or `waitForTimeout` your way to green.
6. **Test bug vs app bug.** If the app misbehaves, do NOT code around it:
   mark the row `blocked (<one-line repro>)` in COVERAGE.md and report it.
   The human decides. Prove a failure is pre-existing (baseline run) before
   attributing it to your change.
7. **Update COVERAGE.md** (status + spec path + new gotchas worth keeping)
   after each row.
8. **Selector escalation:** if a field is genuinely unreachable with the
   existing hooks, add a `data-test` attribute to the shared wrapper component
   (matching the existing convention in `src/components/Analyze/`) as a
   separate, minimal change — and flag it in your report.
9. **Never commit or push.** Leave changes in the working tree and report.
10. Track progress with a task list when processing more than one row.

## Harness contract

- `import { test, expect } from './support/fixtures'` — never from
  `@playwright/test` directly. The fixtures provide `seed` (a `Seeder`,
  auto-cleanup after each test) and fail any test that logs a console error.
- `Seeder` factories create valid uniquely-named entities via admin GraphQL
  (`seed.hierarchy()` for the full crossing→lot→cultivar→group→plants chain);
  `seed.uid()` / `seed.labelId()` give unique values for names typed into the
  UI. PHOTO attribution values cannot be seeded — only created via UI upload.
- `e2e/support/locators.ts`: `formField`, `selectOption`, `saveButton`,
  `listRow`. Extend these helpers rather than repeating selector knowledge in
  specs.
- `e2e/global.setup.ts` already guarantees the stack is reachable and the
  sign-in user exists; specs start signed-in (storage state) with locale
  pinned to en-US.

## Gotchas (raise the relevant ones while working)

- **Hash router**: all URLs are `/#/...`; modals are routes over the list
  (`/cultivars/:id`, `/:id/edit`, `/new`). List search/tab state is in
  `?s=` / `?tab=`.
- **Entity save shows no toast** — the modal closes and the list re-renders.
  The attribution flow DOES toast (`attributions.add.saved`). Save/validation
  errors appear in a tooltip next to the save button.
- **Dirty modals become persistent**: Esc/backdrop no longer close them, and
  arrow-key row navigation is disabled.
- **Split save button** (`.entity-modal-content-save`): its primary action is
  remembered in sessionStorage; a fresh context defaults to plain Save, but
  within one test a prior "save & print" changes the default.
- **Async uniqueness validators** on name fields (300ms debounce): clicking
  save while one is in flight hangs the form forever (known app bug, see
  COVERAGE.md). Always save entity modals through `save()` from
  `support/locators.ts`, which waits the validators out first.
- **q-select portals**: options render in a body-level `.q-menu`, not inside
  the field (see `selectOption`).
- **Auth specs**: use `test.use({ storageState: { cookies: [], origins: [] } })`
  plus `seed.user()` — signing out with the shared session cookie kills every
  parallel spec. Never touch `tester@breedersdb.com` (no password change, no
  delete).
- **fullyParallel**: specs must never share mutable entities or rely on list
  ordering/counts — another worker's rows are visible. Filter lists via `?s=`
  with a seeded unique name before asserting on rows.
- **localStorage prefills**: attribution stepper (form/author/repeat) and
  "new analysis" filters seed themselves from localStorage. Fresh contexts
  start clean; within a test, earlier steps can prefill later ones.
- **Backend schema changed?** Regenerate frontend types
  (`bun --bun run graphql:output`) — but schema changes are out of scope here;
  report instead.

## Done criteria per row

Spec green in isolation AND full suite green, `bun --bun run lint` and
`bun --bun run tsc` clean, COVERAGE.md updated. Report per row: what the spec
covers, anything blocked, any app bugs found.
