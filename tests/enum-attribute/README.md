# ENUM attribute — browser click-through suite

Playwright scripts that drive the **ENUM ("Auswahl" / "Selection") attribute type**
end-to-end through the real UI at `http://localhost`, mirroring the manual test plan
in [`../../ENUM_CLICKTHROUGH_HANDOFF.md`](../../ENUM_CLICKTHROUGH_HANDOFF.md).

These are plain Node + Playwright scripts (not a test runner). Each `tcN-*.js`
drives one test case, prints `PASS`/`FAIL` lines, and cross-checks the result
against Hasura. They were written and validated during a live walkthrough; they
create test data as they go and clean it up via `cleanup.js`.

> **The suite is intentionally not committed.** It documents how the feature was
> verified and lets you re-run it locally; it is not part of CI.

## Prerequisites

- The app running locally (postgres + Hasura + cloud-function + nginx on `:80`,
  and the quasar dev server on `:9200`). See the handoff doc for the exact
  `docker compose` / `bun run dev` commands.
- The seeded dev DB, which must contain:
  - the sample attribute **`Fruit shape (sample)`** (Round[default]/Oblong/Conical/Kidney[disabled]), and
  - a plant whose label id is **`00000004`** (override via `config.js` / `PLANT_LABEL`).
- **Node 18+** (the DB cross-checks use the global `fetch`).
- `backend/.env` present (the cross-checks read `HASURA_GRAPHQL_ADMIN_SECRET` from it).

## Setup

```bash
cd tests/enum-attribute
npm install                 # installs playwright
npx playwright install chromium

export BREEDERSDB_PASSWORD='…'          # required
export BREEDERSDB_EMAIL='tester@breedersdb.com'   # optional, this is the default
npm run auth                # logs in once, saves session to ./.auth/state.json
```

## Run

Run in order — TC3 records a value that TC4–TC7 then edit/inspect:

```bash
npm run tc1   # create an ENUM attribute
npm run tc2   # options-editor validation (empty / duplicate / zero)
npm run tc3   # put sample attr on a form + record an attribution   (HEADED)
npm run tc4   # edit the recorded value
npm run tc5   # rename the in-use option (propagation)
npm run tc6   # in-use delete guard / unused delete / disable
npm run tc7   # Analyze: enum column + filter
npm run cleanup   # remove test data, restore the sample attribute
```

Screenshots are written to `./shots/` (gitignored).

## Notes / gotchas

- **TC3/TC4 use a real plant.** `PLANT_LABEL` in `config.js` must exist in the DB.
- **Headless caveat:** TC3 runs **headed** (`headless: false`). The attribution
  entity-picker step initializes the QR scanner (`BarcodeDetector`), which throws
  `NotSupportedError` in headless Chromium and white-screens the page. The
  "Etiketten-ID" tab needs no camera, but the component still crashes on mount
  headless. Everything else runs headless.
- **The global `/attributions/:id/edit` route is keyed by `cached_attributions.id`,
  not `attributions.id`.** TC4 resolves the right id via Hasura.
- **citext:** `cached_attributions.text_value` / `attribute_name` / `author` are
  `citext`. Pass values to Hasura **inline** (the helpers use `JSON.stringify`),
  not as `String!` variables, or Hasura rejects the query.
- **TC7 depends on a code fix.** The enum Analyze _filter_ requires
  `frontend/src/components/Analyze/Result/filterToQuery.ts` to map
  `ColumnTypes.Enum → 'citext'` (it shipped as `'String'`, which made the filter
  error out with `variable 'v0' is declared as 'String!', but used where 'citext'
is expected`). The column display works regardless.
- **Cleanup deletes by the distinctive `AUTHOR` ("E2E enum test") and `TEST_*`
  names** in `config.js`. Don't point this at a database where those names could
  collide with real data.

## Files

| File                               | Purpose                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| `config.js`                        | URLs, env-based credentials, seeded-DB constants                      |
| `lib.js`                           | browser bootstrap + Quasar UI helpers (selects, dialogs, screenshots) |
| `db.js`                            | Hasura admin query helper (reads the secret from `backend/.env`)      |
| `auth.setup.js`                    | logs in, saves the session                                            |
| `tc1-create.js` … `tc7-analyze.js` | one test case each                                                    |
| `cleanup.js`                       | removes test data, restores the sample attribute                      |
