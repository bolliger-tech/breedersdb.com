# Database

[PostgreSQL](https://www.postgresql.org/docs/16/index.html) >= 16

## UML

![UML](./database-dark.svg)

The UML is generated. See [Updating the UML](#updating-the-uml).

### Updating the UML

To update the UML, run `./generate-uml.sh`.

The script relies on [Planter](https://github.com/achiku/planter) and
[PlantUML](https://plantuml.com/).

### Backup and Restore

```bash
# Backup
docker compose exec postgres sh -c 'PGPASSWORD=$POSTGRESQL_PASSWORD pg_dump -Fc -Upostgres postgres' > db.dump

# Restore
docker compose cp db.dump postgres:/tmp/
docker compose exec --user root postgres sh -c 'PGPASSWORD=$POSTGRESQL_PASSWORD pg_restore -d postgres -U postgres /tmp/db.dump'

# Wipe existing database before restoring
docker compose cp db.dump postgres:/tmp/
docker compose exec --user root postgres sh -c 'PGPASSWORD=$POSTGRESQL_PASSWORD pg_restore --clean -d postgres -U postgres /tmp/db.dump'
```

Restart hasura after restoring the database.

```bash
docker compose restart hasura
```
