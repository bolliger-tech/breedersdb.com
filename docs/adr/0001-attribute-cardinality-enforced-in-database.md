# Attribute cardinality is enforced in the database, and replace deletes

Attributes have a cardinality (`REPEATABLE`, `UNIQUE_BLOCK`, `UNIQUE_REPLACE`) stored as one enum column, so invalid combinations such as "repeatable with replace" cannot exist. Uniqueness is scoped to the exact attributed entity, not the breeding hierarchy. A trigger on `attribution_values` (and on the entity columns of `attributions`) enforces it, so API clients using personal access tokens cannot bypass it and concurrent saves cannot create duplicates. The frontend only shows hints.

## Consequences

- `UNIQUE_REPLACE` **deletes** the existing attribution value, including its notes, in the same transaction. The newest insert always wins, even if it is back-dated before the existing value. History is not kept.
- An attribute cannot be switched to unique while any entity has more than one value of it. Admins must clean up first, so "unique" is a guaranteed fact about the data, not just an input rule.

## Considered Options

- Frontend-only enforcement: rejected, because it can be bypassed and has races.
- Soft replace (mark old value as superseded): rejected as too much new schema and UI scope.
- Grandfathering existing duplicates: rejected, because "replace" would then need to delete several values and Analyze could not rely on uniqueness.
