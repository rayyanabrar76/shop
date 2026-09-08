# Migrations

## What happened here

The migration history had stopped describing the database. Twelve tables and
225 columns lived in `schema.prisma` and in the running database but were
created by no migration: they had been applied by hand and the folder was
never caught up.

Day to day nothing looked wrong, because the database already had them. But
the folder could not build a database from nothing, and it failed in two
separate places:

- `20260906020000_monochrome_default_theme` altered a `StoreTheme` column
  that nothing creates.
- `20260906100000_section_category_picker` wrote to a `CustomSection` table
  that nothing creates.

Both breaks are in the middle of the history and depend on tables that would
not have existed until the end, so adding the missing pieces afterwards could
not have fixed it. The history was replaced by its result instead.

`prisma/migrations/00000000000000_baseline` is
`prisma migrate diff --from-empty --to-schema`, so it is exactly what
`schema.prisma` describes. The 25 files it replaces are kept in
`prisma/migrations-superseded/` and are also in git history at `61c2ab9`.
They are not read by Prisma and can be deleted whenever you like.

## The one-time step on the existing database

The database that was already running records the 26 old migrations and has
no row for the baseline. Left alone, the next `prisma migrate deploy` would
try to create tables that are already there and fail.

Run this **once**, against production:

```
node scripts/baseline-existing-db.mjs
```

It records the baseline as applied rather than running it, and removes the
superseded rows. It touches no application data, only the `_prisma_migrations`
bookkeeping table, and it writes every row it is about to change to
`prisma/_prisma_migrations.backup.json` first.

It has been rehearsed on a scratch database seeded to look exactly like
production, after which `prisma migrate status` came back clean. It is safe to
run twice: the second run sees the baseline row and stops.

Afterwards, check it:

```
npx prisma migrate status
```

## Keeping it from drifting again

```
npm run migrate:verify
```

Creates a scratch database beside the real one, runs every migration into it
from empty, diffs the result against `schema.prisma`, and drops it. An empty
diff means the folder and the schema still agree. Run it after any schema
change, and before any deploy.

This is what caught both breaks above. Neither was visible from the running
application, and neither would have been found by reading the files.

## Adding a migration from here

`prisma migrate dev` works normally again now that the history is consistent.
If it ever refuses because of drift, do not reach for `migrate reset`, which
drops the database. Run `npm run migrate:verify` to see what actually differs.
