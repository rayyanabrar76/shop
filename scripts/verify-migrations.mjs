/*
 * Proves the migration folder can build the schema from nothing.
 *
 * Creates a scratch database beside the real one on the same Neon project,
 * runs every migration into it, then asks Prisma to diff the result against
 * schema.prisma. An empty diff is the proof: the folder and the schema agree.
 * The scratch database is dropped at the end whatever happens.
 *
 * The production database is never written to. The only statements aimed at
 * that connection are CREATE DATABASE and DROP DATABASE for a database
 * called shopflow_migration_check, which nothing else uses.
 *
 * prisma.config.ts resolves the CLI's datasource from DIRECT_URL first, so
 * overriding that in the child process is what points migrate deploy at the
 * scratch database rather than the real one.
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import postgres from 'postgres'

const SCRATCH = 'shopflow_migration_check'
const env = fs.readFileSync('.env', 'utf8')
const direct = (env.match(/DIRECT_URL="([^"]+)"/) || [])[1]
if (!direct) { console.error('no DIRECT_URL in .env'); process.exit(1) }

const scratchUrl = (() => { const u = new URL(direct); u.pathname = '/' + SCRATCH; return u.toString() })()
const hide = s => String(s).replace(/postgres(ql)?:\/\/[^\s"']+/g, '<connection string>')

function prisma(args, extraEnv = {}) {
  try {
    return { ok: true, out: execFileSync('npx', ['prisma', ...args], {
      encoding: 'utf8', env: { ...process.env, ...extraEnv }, shell: true, stdio: ['pipe', 'pipe', 'pipe'],
    }) }
  } catch (e) {
    return { ok: false, out: hide((e.stdout || '') + (e.stderr || '')) }
  }
}

const admin = postgres(direct, { max: 1, idle_timeout: 5 })
let created = false
try {
  console.log('1. creating scratch database ' + SCRATCH)
  await admin.unsafe('DROP DATABASE IF EXISTS "' + SCRATCH + '"')
  await admin.unsafe('CREATE DATABASE "' + SCRATCH + '"')
  created = true
  console.log('   created')

  console.log('2. running every migration into it from empty')
  let r = prisma(['migrate', 'deploy'], { DIRECT_URL: scratchUrl, DATABASE_URL: scratchUrl })
  console.log(r.out.split('\n').filter(l => l.trim()).slice(-6).map(l => '   ' + l).join('\n'))
  if (!r.ok) { console.log('   MIGRATIONS FAILED'); process.exitCode = 1 }
  else {
    console.log('3. comparing the built database against schema.prisma')
    // The connection string goes through the environment, not the argument
    // list. Prisma 7 dropped --from-url, and a Neon URL carries an ampersand
    // that a shell would read as "run this in the background" anyway.
    r = prisma(['migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--script'],
      { DIRECT_URL: scratchUrl, DATABASE_URL: scratchUrl })
    const diff = (r.out || '').split('\n')
      .filter(l => l.trim() && !/Loaded Prisma config/.test(l) && !/^--/.test(l.trim()))
    if (diff.length === 0) console.log('   IDENTICAL. The migrations reproduce the schema exactly.')
    else {
      console.log('   STILL DIFFERENT, ' + diff.length + ' statements:')
      console.log(diff.slice(0, 30).map(l => '   ' + l).join('\n'))
      process.exitCode = 1
    }
  }
} catch (e) {
  console.log('   ERROR: ' + hide(e.message))
  process.exitCode = 1
} finally {
  if (created) {
    console.log('4. dropping the scratch database')
    try { await admin.unsafe('DROP DATABASE IF EXISTS "' + SCRATCH + '"'); console.log('   dropped') }
    catch (e) { console.log('   DROP FAILED, remove ' + SCRATCH + ' by hand: ' + hide(e.message)) }
  }
  await admin.end()
}
