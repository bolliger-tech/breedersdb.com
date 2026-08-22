# E2E coverage plan

Durable state of the e2e test-generation loop (see
`.claude/skills/generate-e2e/SKILL.md`). One row per feature; the loop picks
the next `todo`, writes the spec, runs it until green, then updates the row.

Statuses: `todo` | `partial` | `done` | `blocked (<reason>)`

## Lists (smoke)

| Feature                              | Status | Spec            |
| ------------------------------------ | ------ | --------------- |
| All 16 entity list pages render rows | done   | `smoke.spec.ts` |

## Entity CRUD

Per entity: create via AddModal, view, edit, delete, search via `?s=`.
Template-create (`new/:templateId`) where the UI offers it.

| Entity                 | Status | Spec                             | Notes                                                                                        |
| ---------------------- | ------ | -------------------------------- | -------------------------------------------------------------------------------------------- |
| Orchards               | done   | `orchards.spec.ts`               | pilot: simplest form                                                                         |
| Rootstocks             | done   | `rootstocks.spec.ts`             |                                                                                              |
| Graftings              | done   | `graftings.spec.ts`              |                                                                                              |
| Plant rows (`/rows`)   | done   | `plant-rows.spec.ts`             | needs an orchard to select                                                                   |
| Crossings              | done   | `crossings.spec.ts`              | mother/father cultivar selects                                                               |
| Lots                   | done   | `lots.spec.ts`                   | name segment `\d\d[A-Z]`; crossing + orchard selects                                         |
| Cultivars              | done   | `cultivars.spec.ts`              | pilot: breeders-cultivar/variety toggle; segment input is a masked q-input ("Breeding name") |
| Plant groups           | done   | `plant-groups.spec.ts`           |                                                                                              |
| Plants                 | done   | `plants.spec.ts`                 | no UI delete — Eliminate button `#`-prefixes label id, moves plant to disabled tab           |
| Pollen                 | done   | `pollen.spec.ts`                 |                                                                                              |
| Mother plants          | done   | `mother-plants.spec.ts`          | crossing must have matching mother cultivar (see `Seeder.motherPlant`)                       |
| Attributes             | done   | `attributes.spec.ts`             | one test per data type; ENUM auto-adds an empty option row; RATING has no step input         |
| Attribution forms      | done   | `attribution-forms.spec.ts`      | field picker + required flags; drag-reorder not exercised (native HTML5 DnD)                 |
| Users                  | done   | `users.spec.ts`                  | change-password lives in the edit modal (nested dialog); NEVER touch `tester@breedersdb.com` |
| Personal access tokens | done   | `personal-access-tokens.spec.ts` | create/revoke through UI; token shown once                                                   |
| Attributions (edit)    | done   | `attributions.spec.ts`           | no AddModal — created via attribute flow; test view + edit modal on `/attributions`          |

## Attribution flow (`/{cultivars,plants,groups,lots}/attribute`)

| Feature                                                 | Status | Spec                               | Notes                                                                                           |
| ------------------------------------------------------- | ------ | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Full stepper on cultivars: all input types, save, toast | done   | `attribute-flow-cultivars.spec.ts` | preseed picker mode via localStorage (`__q_strn\|cultivar-select`) — QR default breaks headless |
| Force-save dialog when required fields empty            | done   | `attribute-flow-cultivars.spec.ts` | dialog only fires when some value is set — all-empty shows a no-data notification               |
| Repeat mode (`?repeat=`) keeps form open                | done   | `attribute-flow-cultivars.spec.ts` | on reaching the target the flow returns to the entity picker                                    |
| Ad-hoc extra attribute (AttributionAddFormAddInput)     | done   | `attribute-flow-cultivars.spec.ts` |                                                                                                 |
| Slim happy-path on plants, groups, lots                 | done   | `attribute-flow-slim.spec.ts`      | group step-4 heading shows the generated `G…` label id, not the display name                    |

## Analyze (`/{cultivars,plants,groups,lots}/analyze`)

Filter _logic_ is unit-tested (filterToQuery etc.) — e2e covers integration.

| Feature                                                         | Status | Spec                      | Notes                                                                                                     |
| --------------------------------------------------------------- | ------ | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| Saved-analyses index: list/create/open/delete                   | done   | `analyze-index.spec.ts`   | header actions live in a q-fab titled "More"                                                              |
| Build filter in UI → assert `[data-test="query"]`/`"variables"` | done   | `analyze-filter.spec.ts`  | wait for networkidle before clicking the add-fab — async loads re-render the tree and drop its open state |
| TESTING.md case 1–3: name / attribution filter excl./non-excl.  | done   | `analyze-results.spec.ts` | pin the result set with a shared-lot name-prefix rule — inclusive mode matches every cultivar in the DB   |
| TESTING.md case 4–6: attribution values render, column filter   | done   | `analyze-results.spec.ts` | add columns via exact option label — every attribute also has Count/Max/… variants                        |
| TESTING.md case 7: aggregation columns (count/min/max/mean/…)   | done   | `analyze-results.spec.ts` | FLOAT 0.1+0.9: count 2, max .9, min .1, mean/median .5, population SD .4                                  |
| TESTING.md case 8: group + plant attributions roll up           | done   | `analyze-results.spec.ts` |                                                                                                           |
| Rename / duplicate / note / add-columns-from-form               | done   | `analyze-manage.spec.ts`  | the Add Column menu stays open under the columns-from-form dialog — scope picks to the newest `.q-menu`   |

## Auth & account

Run without the shared storage state (`test.use({ storageState: { cookies: [], origins: [] } })`)
and with a user from `seed.user()` — signing out with the shared session cookie
would kill every parallel spec.

| Feature                                  | Status | Spec | Notes             |
| ---------------------------------------- | ------ | ---- | ----------------- |
| Sign-in: wrong + correct credentials     | todo   |      |                   |
| Sign-out                                 | todo   |      |                   |
| Forgot-password form (submit path only)  | todo   |      | no SMTP assertion |
| Auth guard: unauthenticated → `/sign-in` | todo   |      |                   |

## Misc pages

| Feature                              | Status | Spec | Notes                             |
| ------------------------------------ | ------ | ---- | --------------------------------- |
| `/plants/eliminate` stepper          | todo   |      |                                   |
| `/settings` renders                  | todo   |      | printer settings mostly read-only |
| `/info` renders version + user email | todo   |      |                                   |
| 404 catch-all                        | todo   |      |                                   |

## Explicitly out of scope

`/plants/plant` (WIP stub), `/dev/*` playgrounds, print-bridge printing, QR
camera scanning, reset-password e-mail round trip, XLSX export file contents.

## App bugs found by the loop

- **Save hangs while async uniqueness validation is in flight** (2026-08-21,
  open): in any entity modal with a `useIsUnique` validator (orchards,
  cultivars, ...), clicking save within the 300ms debounce window — or while
  the uniqueness query is running — makes `validate()` never resolve: the save
  button spins forever and no mutation is sent. Reproduce with
  `bun run test:e2e -- orchards.spec.ts --repeat-each=6` after removing the
  wait in `save()` (`e2e/support/locators.ts`). A fast user on a slow
  connection hits the same. Suspect: overlapping `executeQuery()` calls on the
  paused urql query in `src/composables/useIsUnique.ts`.
