---
name: e2e
description: Maintain/extend the frontend Playwright e2e suite. Args:(fix|extend <feature>|audit) [count].
---

# e2e

Maintain the frontend e2e suite: keep it green as the app evolves (`fix`),
grow coverage for new or changed features (`extend`), and find coverage gaps
(`audit`). The durable registry of what is covered is
[frontend/e2e/COVERAGE.md](../../../frontend/e2e/COVERAGE.md).
**Read [frontend/CLAUDE.md](../../../frontend/CLAUDE.md) and the e2e section of
[frontend/TESTING.md](../../../frontend/TESTING.md) first** — they own the
stack and commands. This skill adds only the workflows, the harness contract,
and the non-obvious gotchas.

**Arguments:** `<mode> [args]` — mode is required; if missing or ambiguous,
ask, don't guess.

- `fix` — run the suite, triage every failure, repair or report.
- `extend <feature> [count]` — add coverage for a feature (a COVERAGE.md row,
  an app feature name, or a described new case). `count` = how many coverage
  rows to process this invocation (default 1).
- `audit` — compare the app against COVERAGE.md and update the backlog; writes
  no specs.

## Pre-flight (every invocation)

1. Read `frontend/e2e/COVERAGE.md` and the `frontend/e2e/support/` helpers.
2. Verify the stack is up: `curl -sf http://localhost/`,
   `http://localhost/api/hasura/healthz`, `http://localhost/api/internal/health`.
   The frontend dev server intermittently dies on mass file changes (fsevents
   crash) — restart `bun --bun run dev` in `frontend/` before blaming a spec.
   A red vite-plugin-checker overlay (type/lint error in ANY file, including
   `e2e/**`) blocks all pointer events, so `bun --bun run tsc` must be clean
   or every click times out.
3. Establish the baseline: `cd frontend && bun run test:e2e`. For `extend` and
   `audit` it must be green before you change anything — if it is not, switch
   to `fix` (or report) first; never build on a red baseline. For `fix`, the
   red baseline is the work item.

## Mode: fix

1. Run the full suite (or the named spec) to collect the failure set.
2. Diagnose each failure from the error and the trace (`--trace on`, the html
   report, the `trace.zip` `*.network` JSONL for hung requests) — not
   guesswork. Then classify:
   - **Test bug / flake** — fix the spec or a shared helper. Prefer extending
     the deflake patterns in `e2e/support/locators.ts` / `analyze.ts` over
     per-spec waits. Reproduce flakes with `--repeat-each=6` (or repeated full
     runs) before the fix and prove the fix the same way.
   - **Intentional app change** — confirm it via `git log` / `git diff` on the
     touched frontend source, then update the spec to assert the new behavior
     and refresh the COVERAGE.md row's notes.
   - **App regression** — do NOT code around it: record it under "App bugs
     found by the loop" in COVERAGE.md (one-line repro), mark the row
     `blocked (<reason>)` if the spec cannot run, and report. The human
     decides.
3. Re-run fixed specs in isolation, then the full suite; `bun --bun run lint`
   and `bun --bun run tsc` clean.

**Done when:** full suite green (or every remaining failure classified as app
regression and reported), COVERAGE.md truthful.

## Mode: extend

1. Locate or create the COVERAGE.md row(s): pick the matching section, add new
   rows as `todo` (or set an existing row to `partial` when adding cases to
   it). Respect the "Explicitly out of scope" list unless the user overrides.
2. Then run the loop below, one row at a time, `count` rows max.

### The loop (non-negotiable rules)

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

**Done when (per row):** spec green in isolation AND full suite green,
`bun --bun run lint` and `bun --bun run tsc` clean, COVERAGE.md updated.
Report per row: what the spec covers, anything blocked, any app bugs found.

## Mode: audit

Writes no specs — backlog upkeep and a gap report only.

1. Enumerate the app surface: routes in `frontend/src/router/routes.ts` (and
   the pages/components they mount) vs the features covered in COVERAGE.md.
2. Check recent history: `git log` on `frontend/src/` since the newest spec
   commit — features added or changed without a matching spec/COVERAGE.md
   update are candidates.
3. Update COVERAGE.md: add `todo` rows for uncovered features, flag rows whose
   feature changed or disappeared (fix the row or note the mismatch). Respect
   the "Explicitly out of scope" list.
4. Report the gaps, most valuable first, recommending `/e2e extend <feature>`
   for each.

**Done when:** COVERAGE.md reflects the current app and the report is
delivered.

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
