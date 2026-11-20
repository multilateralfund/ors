# Copying production data to staging

Use this when staging needs a fresh copy of production data. It replaces the
whole staging database and media with production's. Production users are
kept, because many tables have `PROTECT` foreign keys to them, but they are
locked out. The staging accounts are then put back on top.

Two management commands do the user handling:

| Command | Run where / when | What it does |
|---|---|---|
| `export_local_users` | staging, **before** the restore | Writes the staging accounts to JSON: hash, type, country, agency, groups, permissions, DRF token. Also writes the email constance settings. |
| `post_prod_restore` | staging, **after** the restore + migrate | In one transaction: logs everyone out, makes production passwords unusable, can scrub production emails, re-applies the staging accounts by username, restores the email constance settings. |

The commands below assume the standard `docker-compose.yml` (`postgres`,
`app`, `celery`, `nginx`, `nextjs`, `redis`) and are run from the compose
directory.

## 0. Before you start

- The staging image must already include both commands. Merge and deploy
  first.
- Staging must have its **own** `DJANGO_SECRET_KEY`. JWTs are signed with it,
  so production tokens are then invalid on staging.
- `ADFS_ENABLED` must be off on staging. If it is on, the ADFS backends match
  users by email, so real users could sign in to staging as their production
  account.
- The production Postgres major version must be ≤ the staging one, since
  `pg_restore` cannot read dumps from a newer server.
- Let staging users know that staging will be down and that local data
  entered on staging will be lost.

## 1. Production: dump the database and the files

```bash
# on the production host
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > prod_$(date +%F).dump

docker compose exec -T app tar -C /app/.fs -czf - media protected_media \
  > prod_media_$(date +%F).tgz
```

Copy both files to the staging host (e.g. `scp`). They contain personal
data, so don't leave copies lying around.

## 2. Staging: export the local accounts and take a backup

```bash
# on the staging host, while staging is still running
docker compose exec app python manage.py export_local_users --out /tmp/staging_users.json
docker compose cp app:/tmp/staging_users.json ./staging_users.json
docker compose exec app rm /tmp/staging_users.json
chmod 600 staging_users.json
```

- By default every staging user is exported. If they are all re-applied,
  every staging login keeps working with its staging password and roles.
  Where a username also exists in production, that row gets the staging
  password and roles.
- To bring back only a known set of testers, pass `--username alice
  --username bob ...`. Everyone else then gets their production row,
  locked.
- `--active-only` skips inactive accounts.

Then back up staging so you can roll back:

```bash
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > staging_backup_$(date +%F).dump

docker compose exec -T app tar -C /app/.fs -czf - media protected_media \
  > staging_media_backup_$(date +%F).tgz
```

## 3. Staging: stop the app and restore

Stop everything that serves traffic or runs jobs. Until step 4 is done,
production passwords would work on staging and Celery could send emails.

```bash
docker compose stop nginx nextjs app celery
```

Restore the database:

```bash
docker compose exec -T postgres sh -c \
  'psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE \"$POSTGRES_DB\" WITH (FORCE);" \
   && psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\";"'

docker compose exec -T postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl' \
  < prod_YYYY-MM-DD.dump
```

Restore the files. This replaces the staging `media` and `protected_media`:

```bash
docker compose run --rm --no-deps -T --entrypoint sh app -c \
  'rm -rf /app/.fs/media /app/.fs/protected_media && tar -C /app/.fs -xzf -' \
  < prod_media_YYYY-MM-DD.tgz
```

Clear the Redis cache, which still holds staging's dashboard metrics:

```bash
docker compose exec redis redis-cli FLUSHALL
```

## 4. Staging: migrate and lock down

`docker compose run` goes through the entrypoint, which runs `migrate` first.
Staging is usually ahead of production in migrations.

Do a dry run first. It does everything, prints the summary, then rolls back:

```bash
DB=$(docker compose run --rm -T --entrypoint sh app -c 'echo $POSTGRES_DB')

docker compose run --rm -v "$PWD/staging_users.json:/tmp/staging_users.json:ro" app \
  python manage.py post_prod_restore /tmp/staging_users.json \
    --confirm-db "$DB" --scrub-emails --dry-run
```

Read the warnings:

- **group / permission does not exist**: the production DB has an older
  group set. Run `python manage.py import_user_permissions import_user_groups`,
  then run the command again.
- **Country / Agency not found**: the staging user points to a
  country or agency that is not in production. The field is left empty, so
  fix that user in the admin afterwards.
- **email also used by production user(s)**: a staging account shares an
  email with a production account under a different username. This is
  harmless with ADFS off and goes away with `--scrub-emails`.

If the dry run looks right, run it again without `--dry-run`.

Options:

- `--confirm-db` (required) must equal the configured database name. The
  command also refuses to run if `SENTRY_ENVIRONMENT=production`.
- `--scrub-emails` rewrites production users' emails to
  `user-<id>@example.invalid`, so nothing on staging can email real
  people. Recommended.
- `--deactivate-prod-users` also sets `is_active=False`. Production users
  are locked out either way. Use this only if you also want them gone from
  active-user lists. Note that this changes what testers see in user
  pickers and recipient lists.

## 5. Staging: start and check

```bash
docker compose up -d
docker compose exec app python manage.py shell -c \
  "from core.tasks import refresh_dashboard_metrics_cache; refresh_dashboard_metrics_cache.delay()"
```

Check:

- [ ] A staging account can log in and has the expected permissions.
- [ ] A production-only username cannot log in.
- [ ] Admin → Constance: the email and notification settings are staging's,
      not production's.
- [ ] A few attachments and PCR or project files open (media copied).
- [ ] The dashboard loads once the cache refresh has finished.

## 6. Clean up

```bash
shred -u staging_users.json prod_*.dump prod_media_*.tgz   # or rm on macOS
```

Keep the `staging_backup_*` files until people have confirmed staging is
fine, then delete them too.

## Rolling back

Repeat step 3 using `staging_backup_*.dump` and
`staging_media_backup_*.tgz`. Then run `docker compose up -d`. You don't need
`post_prod_restore`, because the backup already has the staging accounts.
