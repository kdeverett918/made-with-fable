// Deletes storage objects in the `media` bucket that no row references and
// that are older than MIN_AGE_HOURS (so in-flight submissions are safe).
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Pass --dry-run to preview.
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY = process.argv.includes('--dry-run')
const MIN_AGE_HOURS = 24

if (!SUPABASE_URL || !KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  process.exit(1)
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json()
}

async function listAll(prefix) {
  const out = []
  for (let offset = 0; ; offset += 100) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/media`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prefix, limit: 100, offset }),
    })
    if (!res.ok) throw new Error(`list ${prefix}: ${res.status}`)
    const items = await res.json()
    for (const item of items) {
      if (item.id === null) {
        // folder — recurse
        out.push(...(await listAll(prefix ? `${prefix}/${item.name}` : item.name)))
      } else {
        out.push({ path: prefix ? `${prefix}/${item.name}` : item.name, created: item.created_at })
      }
    }
    if (items.length < 100) break
  }
  return out
}

const referenced = new Set()
for (const row of await rest('creation_media?select=storage_path,poster_path')) {
  referenced.add(row.storage_path)
  if (row.poster_path) referenced.add(row.poster_path)
}
for (const row of await rest('creations?select=og_image_path&og_image_path=not.is.null')) {
  referenced.add(row.og_image_path)
}
for (const row of await rest('profiles?select=avatar_url&avatar_url=not.is.null')) {
  const m = row.avatar_url?.match(/\/object\/public\/media\/(.+)$/)
  if (m) referenced.add(decodeURIComponent(m[1]))
}

const objects = await listAll('')
const cutoff = Date.now() - MIN_AGE_HOURS * 3600 * 1000
const orphans = objects.filter(
  (o) => !referenced.has(o.path) && new Date(o.created).getTime() < cutoff,
)

console.log(
  `objects: ${objects.length}, referenced: ${referenced.size}, orphans to delete: ${orphans.length}`,
)
for (const o of orphans) console.log(`${DRY ? '[dry-run] ' : ''}delete ${o.path}`)

if (!DRY && orphans.length > 0) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/media`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ prefixes: orphans.map((o) => o.path) }),
  })
  console.log('bulk delete:', res.status)
}
