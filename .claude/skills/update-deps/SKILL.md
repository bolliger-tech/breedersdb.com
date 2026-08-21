---
name: update-deps
description: Upgrade a service's dependencies with per-package changelog review, impact assessment, and real-harness verification. Args:(backend|cloud-function|frontend) [minor|major]. Backend also bumps the Ansible deploy pin. Never commits unless the user explicitly asks.
disable-model-invocation: true
---

# update-deps

Upgrade one service's dependencies. **Read the target service's `CLAUDE.md`
first** ([backend](../../../backend/CLAUDE.md), [cloud-function](../../../cloud-function/CLAUDE.md),
[frontend](../../../frontend/CLAUDE.md), and the root) — it owns the stack,
commands, and test-runner mechanics. This skill adds only the process,
verification, and non-obvious gotchas; it deliberately names _what_ to do and
defers _how_ to those docs, so it survives stack changes.

**Arguments:** `<service> [level]`

- `service` — `backend` | `cloud-function` | `frontend` (required; if missing/invalid, ask)
- `level` — `minor` (default: within current semver ranges) | `major` (also take major bumps)

## Non-negotiable rules (all services)

1. **One package/version at a time.** Never batch.
2. **Read the changelog for every version you cross, then judge impact against how the code actually uses the package** before applying. Surface breaking changes to the user (a table works well).
3. **Verify after each bump with the service's real test harness**, not just a typecheck.
4. **Never commit or push** — in any repo, including the deploy repo. Leave changes in the working tree and report. Commit only if the user later says so. This overrides any "commit after each task" habit.
5. On a test failure, **prove whether it is pre-existing** (fails on the pre-upgrade version too, or is byte-identical to `main`) before blaming the upgrade. Report the attribution.
6. Track progress with a task list (one task per package/version).

---

## service: cloud-function

1. List outdated packages; pick targets by level (`minor` = within range, `major` = latest).
2. Bring the stack up with file-watching enabled so a `package.json` bump rebuilds the container automatically (per CLAUDE.md). The smoke test runs through nginx→Hasura, so the backend must be up too.
3. Establish a **green baseline**: run the smoke test (CLAUDE.md) before changing anything.
4. Per package: read the changelog, grep `src/` for the import and judge exposure, apply the bump, typecheck. Then **wait for the watched container to finish rebuilding with the new version** — otherwise you test the stale build — and run the smoke test again (CLAUDE.md, seeded dev user), requiring it to pass.
5. Stop the watcher when done.

**Gotchas / judgment (raise the relevant ones):**

- The smoke test covers **jose** and **functions-framework** but not **sharp**, **@google-cloud/storage**, or **nodemailer** — for those, "verified" means typecheck + the container booting healthy (imports resolve, native binaries load).
- **prettier** is enforced by the _root_ formatter, not this package's copy — a local bump is inert and the pre-commit hook may reformat with the root version; note the mismatch, don't fight it.
- **@types/node**: hold at the container runtime's major even under `major`, unless the runtime is bumped too.
- **typescript** major (native `tsgo`): drop-in here (we only run `tsc` via scripts); platform binaries ship in the lockfile, so no pipeline change.

---

## service: backend

The "dependency" is the Hasura image tag in `backend/docker-compose.yaml` — no package manager.

1. Pick the target: `minor` = latest `v2.x`. `major` = Hasura v3, which is a **different product, not a drop-in** — stop and tell the user it's a migration.
2. **Read the release notes for every version between current and target**, and judge each breaking change against _our_ metadata. Surface the assessment.
3. Bump the tag, recreate on the new image, and run the metadata/migrate apply sequence from CLAUDE.md; require **metadata consistent**.
4. Run the API test suite (CLAUDE.md). **Gotcha:** the runner leaves the live Hasura pointed at the _test_ DB — afterwards restore it to the dev DB and re-apply metadata.
5. Attribute any failure per rule 5 (re-run on the old tag, then restore).
6. **Always also bump the Ansible pin** (below).

**Always: update Ansible.** In the sibling repo `../breedersdb.com-deploy`, set `hasura_version` in `ansible/playbook.yaml` to the same tag (single source of truth for the Cloud Run deploy). That repo may hold unrelated uncommitted changes — make only the version edit and don't commit (rule 4).

---

## service: frontend

**Stub — not yet implemented.** Its verification differs enough (bun, gql.tada type regen, Quasar/Vite, `frontend/TESTING.md`) to need its own procedure. Tell the user it isn't implemented and stop — don't attempt an upgrade.
