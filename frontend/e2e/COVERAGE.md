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

| Entity                 | Status | Spec                   | Notes                                                                                        |
| ---------------------- | ------ | ---------------------- | -------------------------------------------------------------------------------------------- |
| Orchards               | done   | `orchards.spec.ts`     | pilot: simplest form                                                                         |
| Rootstocks             | done   | `rootstocks.spec.ts`   |                                                                                              |
| Graftings              | done   | `graftings.spec.ts`    |                                                                                              |
| Plant rows (`/rows`)   | done   | `plant-rows.spec.ts`   | needs an orchard to select                                                                   |
| Crossings              | done   | `crossings.spec.ts`    | mother/father cultivar selects                                                               |
| Lots                   | done   | `lots.spec.ts`         | name segment `\d\d[A-Z]`; crossing + orchard selects                                         |
| Cultivars              | done   | `cultivars.spec.ts`    | pilot: breeders-cultivar/variety toggle; segment input is a masked q-input ("Breeding name") |
| Plant groups           | done   | `plant-groups.spec.ts` |                                                                                              |
| Plants                 | todo   |                        | label id `\d{8}`; rootstock/grafting/row selects; eliminate flag                             |
| Pollen                 | todo   |                        |                                                                                              |
| Mother plants          | todo   |                        | crossing must have matching mother cultivar (see `Seeder.motherPlant`)                       |
| Attributes             | todo   |                        | one spec per data type incl. ENUM options editor                                             |
| Attribution forms      | todo   |                        | field picker + required flags + ordering                                                     |
| Users                  | todo   |                        | create own user; NEVER touch `tester@breedersdb.com`; change-password only on created user   |
| Personal access tokens | todo   |                        | create/revoke through UI; token shown once                                                   |
| Attributions (edit)    | todo   |                        | no AddModal — created via attribute flow; test view + edit modal on `/attributions`          |

## Attribution flow (`/{cultivars,plants,groups,lots}/attribute`)

| Feature                                                 | Status | Spec | Notes                                             |
| ------------------------------------------------------- | ------ | ---- | ------------------------------------------------- |
| Full stepper on cultivars: all input types, save, toast | todo   |      | photo upload needs a fixture jpg in `e2e/assets/` |
| Force-save dialog when required fields empty            | todo   |      |                                                   |
| Repeat mode (`?repeat=`) keeps form open                | todo   |      |                                                   |
| Ad-hoc extra attribute (AttributionAddFormAddInput)     | todo   |      |                                                   |
| Slim happy-path on plants, groups, lots                 | todo   |      |                                                   |

## Analyze (`/{cultivars,plants,groups,lots}/analyze`)

Filter _logic_ is unit-tested (filterToQuery etc.) — e2e covers integration.

| Feature                                                         | Status | Spec | Notes                                                       |
| --------------------------------------------------------------- | ------ | ---- | ----------------------------------------------------------- |
| Saved-analyses index: list/create/open/delete                   | todo   |      | plain entity list                                           |
| Build filter in UI → assert `[data-test="query"]`/`"variables"` | todo   |      | DB-independent; hidden debug block in `AnalyzeResult.vue`   |
| TESTING.md case 1–3: name / attribution filter excl./non-excl.  | todo   |      | seed data via `Seeder`, values via `seed.attribution()`     |
| TESTING.md case 4–6: attribution values render, column filter   | todo   |      |                                                             |
| TESTING.md case 7: aggregation columns (count/min/max/mean/…)   | todo   |      | recompute expected values — the doc's rating row has a typo |
| TESTING.md case 8: group + plant attributions roll up           | todo   |      |                                                             |
| Rename / duplicate / note / add-columns-from-form               | todo   |      |                                                             |

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
