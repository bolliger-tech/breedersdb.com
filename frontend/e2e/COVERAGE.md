# E2E coverage plan

Durable registry of e2e coverage, maintained by the `e2e` skill
(`.claude/skills/e2e/SKILL.md`). One row per feature; the skill's modes keep
it current: `fix` keeps rows truthful, `extend` works `todo` rows into green
specs, `audit` adds rows for uncovered features.

Statuses: `todo` | `partial` | `done` | `blocked (<reason>)`

Navigation invariant: the app is a hash-route SPA, so a `page.goto` between
two `#/…` routes is a same-document navigation that returns before Vue Router
swapped the view. The `page` fixture (`support/fixtures.ts`) turns those into
real document loads, so a spec may treat every `goto` as a fresh app boot.

## Lists (smoke)

| Feature                              | Status | Spec            |
| ------------------------------------ | ------ | --------------- |
| All 16 entity list pages render rows | done   | `smoke.spec.ts` |

## List table features

Shared `EntityListTable` behavior — test on one representative entity list.
Under `fullyParallel`, pin the row set with a seeded unique name prefix via
`?s=` before asserting on ordering or counts.

| Feature                                | Status | Spec                 | Notes                                                                                                |
| -------------------------------------- | ------ | -------------------- | ---------------------------------------------------------------------------------------------------- |
| Column selector: show/hide columns     | done   | `list-table.spec.ts` | persistence (localStorage) is asserted on a second page, so the first keeps its state for the re-add |
| Sorting via header cells               | done   | `list-table.spec.ts` | seed rows with a shared prefix, filter via `?s=`                                                     |
| Pagination                             | done   | `list-table.spec.ts` | pin `?rowsPerPage=10` in the URL; bottom controls are icon-only (`chevron_right`)                    |
| XLSX export button triggers a download | done   | `list-table.spec.ts` | asserts the download event only — file contents are out of scope                                     |

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

## Enum ("Selection") attributes

The options editor (`AttributeEnumOptionsInput`) plus everything downstream of
an enum option: recorded values, renames, disabling, Analyze.

| Feature                                                       | Status | Spec                             | Notes                                                                                             |
| ------------------------------------------------------------- | ------ | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Create with a pre-selected and a disabled option              | done   | `attributes.spec.ts`             | enum has no "Default value" field; the view modal's preview starts on the pre-selected option     |
| Options editor validation: empty / duplicate / zero options   | done   | `attributes.spec.ts`             | the messages render inline, the modal stays open and nothing is persisted                         |
| In-use option: delete blocked + tooltip; add / delete unused  | done   | `attribute-enum-options.spec.ts` | usage comes from `attribution_values.attribute_enum_option_id`                                    |
| Rename an in-use option relabels existing attributions        | done   | `attribute-enum-options.spec.ts` | the denormalized `cached_attributions.text_value` follows the rename                              |
| Disable an in-use option: value kept, hidden from new pickers | done   | `attribute-enum-options.spec.ts` | `AttributionInputEnum` keeps a disabled option visible when it is the current value               |
| Edit a recorded selection value                               | done   | `attributions.spec.ts`           | the edit modal's control is a picker, not a text input                                            |
| Analyze: enum as a result column and as a filter rule         | done   | `analyze-results.spec.ts`        | the term control is a picker (`selectFilterTerm`); its GraphQL variable is `citext`, not `String` |

## Entity view details

View-modal content beyond the plain field table — currently only asserted
implicitly (modal opens) by the CRUD specs.

| Feature                                                   | Status | Spec                  | Notes                                                                                                                               |
| --------------------------------------------------------- | ------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Attributions render on an entity view modal (incl. photo) | done   | `entity-view.spec.ts` | photo via UI upload — use `uploadPhoto()` (waits for the preview; saving earlier drops the value); gallery class is `.q-scrollarea` |
| Related-entity tables on view modals                      | done   | `entity-view.spec.ts` | plant rows repeat the group name — pin the group row via its drill-down `a[href]`                                                   |

## Attribution flow (`/{cultivars,plants,groups,lots}/attribute`)

| Feature                                                 | Status | Spec                               | Notes                                                                                           |
| ------------------------------------------------------- | ------ | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Full stepper on cultivars: all input types, save, toast | done   | `attribute-flow-cultivars.spec.ts` | preseed picker mode via localStorage (`__q_strn\|cultivar-select`) — QR default breaks headless |
| Force-save dialog when required fields empty            | done   | `attribute-flow-cultivars.spec.ts` | dialog only fires when some value is set — all-empty shows a no-data notification               |
| Repeat mode (`?repeat=`) keeps form open                | done   | `attribute-flow-cultivars.spec.ts` | on reaching the target the flow returns to the entity picker                                    |
| Ad-hoc extra attribute (AttributionAddFormAddInput)     | done   | `attribute-flow-cultivars.spec.ts` |                                                                                                 |
| Slim happy-path on plants, groups, lots                 | done   | `attribute-flow-slim.spec.ts`      | group step-4 heading shows the generated `G…` label id, not the display name                    |
| `walkToForm` preseeds the picker mode                   | done   | `support/attribute-flow.ts`        | `addInitScript` only applies to a fresh document — the `page` fixture makes every goto one      |

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

| Feature                                        | Status | Spec           | Notes                                                                                       |
| ---------------------------------------------- | ------ | -------------- | ------------------------------------------------------------------------------------------- |
| Sign-in: wrong + correct credentials           | done   | `auth.spec.ts` |                                                                                             |
| Sign-out                                       | done   | `auth.spec.ts` |                                                                                             |
| Forgot-password form (submit path only)        | done   | `auth.spec.ts` | no SMTP assertion                                                                           |
| Auth guard: unauthenticated → `/sign-in`       | done   | `auth.spec.ts` |                                                                                             |
| Reset-password page: invalid token shows error | done   | `auth.spec.ts` | `?token=bogus` → 401 message; q-btn with `to` renders as a link (role `link`, not `button`) |

## Misc pages

| Feature                              | Status | Spec                 | Notes                                                        |
| ------------------------------------ | ------ | -------------------- | ------------------------------------------------------------ |
| `/plants/eliminate` stepper          | done   | `misc-pages.spec.ts` | preseed picker to label-id mode (QR default breaks headless) |
| `/settings` renders                  | done   | `misc-pages.spec.ts` | printer settings mostly read-only                            |
| `/info` renders version + user email | done   | `misc-pages.spec.ts` |                                                              |
| 404 catch-all                        | done   | `misc-pages.spec.ts` |                                                              |

## Explicitly out of scope

`/plants/plant` (WIP stub), `/dev/*` playgrounds, print-bridge printing, QR
camera scanning, reset-password e-mail round trip, XLSX export file contents.

## App bugs found by the loop

None open.
