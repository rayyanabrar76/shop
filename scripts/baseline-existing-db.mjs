/*
 * One-time reconciliation for a database that predates the baseline.
 *
 * The running database has its tables and its data, and a _prisma_migrations
 * table listing 26 migrations that no longer exist in prisma/migrations. It
 * has no row for the baseline. Left alone, the next `prisma migrate deploy`
 * would try to apply the baseline for real and fail on CREATE TABLE "User",
 * because the table is already there.
 *
 * So the baseline is recorded as applied rather than run, which is what
 * Prisma calls baselining, and the superseded rows are removed so the history
 * matches the folder.
 *
 * Nothing here reads or writes application data. It only edits the bookkeeping
 * table Prisma keeps for itself, and the rows it removes are written to
 * prisma/_prisma_migrations.backup.json first so the change can be undone.
 *
 * Run once, against production: node scripts/baseline-existing-db.mjs
 */
import fs from 'fs'
import postgres from 'postgres'

const BASELINE = '00000000000000_baseline'
const BACKUP = 'prisma/_prisma_migrations.backup.json'

// The environment wins over the file, so this can be pointed at a scratch
// database and rehearsed before it is aimed at the real one.
const url = process.env.DIRECT_URL || (fs.readFileSync('.env', 'utf8').match(/DIRECT_URL="([^"]+)"/) || [])[1]
if (!url) { console.error('no DIRECT_URL in the environment or .env'); process.exit(1) }

const sql = postgres(url, { max: 1, idle_timeout: 5 })
try {
  const rows = await sql`SELECT * FROM "_prisma_migrations" ORDER BY started_at`
  console.log('found ' + rows.length + ' recorded migrations')

  if (rows.some(r => r.migration_name === BASELINE)) {
    console.log('baseline already recorded, nothing to do')
    process.exit(0)
  }

  fs.writeFileSync(BACKUP, JSON.stringify(rows, null, 2))
  console.log('backed up every row to ' + BACKUP)

  // Recorded as applied, finished at the same moment it started: it did not
  // run here, it describes what this database already is.
  await sql`
    INSERT INTO "_prisma_migrations"
      (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
    VALUES
      (gen_random_uuid()::text, ${'baselined-' + BASELINE}, now(), ${BASELINE}, NULL, NULL, now(), 1)
  `
  console.log('recorded ' + BASELINE + ' as applied')

  const removed = await sql`DELETE FROM "_prisma_migrations" WHERE migration_name <> ${BASELINE} RETURNING migration_name`
  console.log('removed ' + removed.length + ' superseded rows')

  const left = await sql`SELECT migration_name FROM "_prisma_migrations"`
  console.log('history is now: ' + left.map(r => r.migration_name).join(', '))
} finally {
  await sql.end()
}
