import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const MEDIA_BUCKET = 'media'

function loadEnvFile(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)\s*$/)
    if (!match) continue
    const key = match[1].trim()
    const value = match[2].trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(path.join(ROOT, '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this seed.',
  )
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const gameBase = 'https://jr-moguls-studio.onrender.com/games'

const projects = [
  {
    slug: 'thetechslp',
    title: 'The Tech SLP',
    category: 'websites',
    liveUrl: 'https://thetechslp.com',
    image: 'seed-assets/prepared/thetechslp.webp',
    tags: ['website', 'slp', 'tools', 'portfolio'],
    story:
      'A clinician-built studio site with sharp positioning, practical tool previews, and a clear path from curiosity to booking.',
    prompt:
      'Design a premium, clinician-aware studio homepage for an SLP who builds websites and tools. Keep the tone credible, fast, and useful.',
  },
  {
    slug: 'flimflam',
    title: 'Flimflam',
    category: 'games',
    liveUrl: 'https://flimflam.gg',
    image: 'seed-assets/prepared/flimflam.webp',
    tags: ['games', 'party', 'multiplayer', 'web'],
    story:
      'A browser-first party game hub: one screen, every phone, instant rooms, and a lineup designed for loud game nights.',
    prompt:
      'Build a party-game arcade hub that feels electric, quick to join, and playable from any phone without app installs.',
  },
  {
    slug: 'the-villa',
    title: 'The Villa',
    category: 'games',
    liveUrl: 'https://the-villa-iypp.onrender.com',
    image: 'seed-assets/prepared/the-villa.webp',
    tags: ['game', 'social', 'ai', 'multiplayer'],
    story:
      'A co-op reality-show deception game about secret alliances, voting, gossip, and surviving the firepit without getting exposed.',
    prompt:
      'Create an episode-based social deduction game with expressive NPCs, secret alliances, and a dramatic villa interface.',
  },
  {
    slug: 'jrmoguls',
    title: 'Jr. Moguls',
    category: 'tools',
    liveUrl: 'https://jrmoguls.ai',
    image: 'seed-assets/prepared/jrmoguls.webp',
    tags: ['kids', 'ai', 'learning', 'projects'],
    story:
      'A project recipe platform where kids pick an age band, direct the idea, and build real AI-assisted projects with adult guardrails.',
    prompt:
      'Design a playful but trusted project platform for parents and kids that makes AI creation feel concrete, safe, and shippable.',
  },
  {
    slug: 'builders-snake',
    title: 'Rewind Snake',
    category: 'games',
    liveUrl: `${gameBase}/builders-snake/index.html`,
    video: 'seed-assets/final/builders-snake.mp4',
    poster: 'seed-assets/prepared/builders-snake.webp',
    tags: ['game', 'arcade', 'canvas'],
    story:
      'A classic snake loop rebuilt with a rewind mechanic, readable controls, and a polished arcade feel for quick browser play.',
    prompt:
      'Make a responsive browser arcade game where snake movement is simple, the scoring is legible, and one mechanic gives it a twist.',
  },
  {
    slug: 'builders-tetris',
    title: 'Glitch Drop',
    category: 'games',
    liveUrl: `${gameBase}/builders-tetris/index.html`,
    video: 'seed-assets/final/builders-tetris.mp4',
    poster: 'seed-assets/prepared/builders-tetris.webp',
    tags: ['game', 'blocks', 'arcade'],
    story:
      'A falling-block browser game with bright pieces, compact controls, and a clean layout that works as both lesson artifact and playable game.',
    prompt:
      'Build a falling-block game for the browser with touch controls, keyboard controls, scoring, next-piece preview, and crisp visual feedback.',
  },
  {
    slug: 'makers-boss-rush',
    title: 'Makers Boss Rush',
    category: 'games',
    liveUrl: `${gameBase}/makers-boss-rush/index.html`,
    video: 'seed-assets/final/makers-boss-rush.mp4',
    poster: 'seed-assets/prepared/makers-boss-rush.webp',
    tags: ['game', 'action', 'boss'],
    story:
      'A compact action prototype with wave pressure, ability cards, readable boss health, and just enough chaos to feel like a real game loop.',
    prompt:
      'Create a boss-rush game with a huge center boss, cooldown abilities, wave pressure, score, and visible player feedback.',
  },
]

function contentType(file) {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.webp') return 'image/webp'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.mp4') return 'video/mp4'
  if (ext === '.webm') return 'video/webm'
  return 'application/octet-stream'
}

function localPath(file) {
  const abs = path.join(ROOT, file)
  if (!existsSync(abs)) throw new Error(`Missing asset: ${file}. Run npm run previews:dizzy first.`)
  return abs
}

async function uploadAsset(file, storageName) {
  const abs = localPath(file)
  const storagePath = `dizzy/${storageName}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, readFileSync(abs), {
      contentType: contentType(abs),
      upsert: true,
    })
  if (error) throw error
  return storagePath
}

async function imageSize(file) {
  const meta = await sharp(localPath(file)).metadata()
  if (!meta.width || !meta.height) throw new Error(`Could not read dimensions for ${file}`)
  return { width: meta.width, height: meta.height }
}

async function oneByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()
  if (error) throw error
  return data
}

async function findDizzyProfile() {
  const explicitId = process.env.DIZZY_USER_ID
  if (explicitId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', explicitId)
      .single()
    if (error) throw error
    return data
  }

  const existing = await oneByUsername('dizzy')
  if (existing) return existing

  const previousUsername = process.env.DIZZY_CURRENT_USERNAME
  if (previousUsername) {
    const previous = await oneByUsername(previousUsername)
    if (!previous)
      throw new Error(`No profile found for DIZZY_CURRENT_USERNAME=${previousUsername}`)
    return previous
  }

  const { data: admins, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_admin', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  if ((admins ?? []).length === 1) return admins[0]

  throw new Error(
    'Could not choose the Dizzy profile safely. Set DIZZY_USER_ID or DIZZY_CURRENT_USERNAME.',
  )
}

async function anonymizeProfile(profileId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      username: 'dizzy',
      display_name: 'Dizzy',
      avatar_url: null,
      bio: 'Pinned work from live sites, browser games, and useful tools made with Fable.',
      website_url: 'https://thetechslp.com',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function deleteDemoCreations() {
  if (process.env.KEEP_DEMO_CONTENT === '1') return
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id')
    .in('username', ['fabletester', 'demomaker'])
  if (error) throw error
  const ids = (profiles ?? []).map((profile) => profile.id)
  if (ids.length === 0) return
  const { error: deleteError } = await supabase.from('creations').delete().in('author_id', ids)
  if (deleteError) throw deleteError
}

async function seedTags(names) {
  const unique = [...new Set(names)]
  if (unique.length === 0) return []
  const { error } = await supabase.from('tags').upsert(
    unique.map((name) => ({ name })),
    { onConflict: 'name', ignoreDuplicates: true },
  )
  if (error) throw error
  const { data, error: selectError } = await supabase
    .from('tags')
    .select('id, name')
    .in('name', unique)
  if (selectError) throw selectError
  return data ?? []
}

async function main() {
  const profile = await anonymizeProfile((await findDizzyProfile()).id)

  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .select('id, slug')
  if (categoryError) throw categoryError
  const categoryBySlug = new Map((categories ?? []).map((category) => [category.slug, category.id]))

  await deleteDemoCreations()

  const titles = projects.map((project) => project.title)
  const { error: deleteExistingError } = await supabase
    .from('creations')
    .delete()
    .eq('author_id', profile.id)
    .in('title', titles)
  if (deleteExistingError) throw deleteExistingError

  for (const [index, project] of projects.entries()) {
    const categoryId = categoryBySlug.get(project.category)
    if (!categoryId) throw new Error(`Missing category ${project.category}`)

    const mediaRows = []
    let ogImagePath = null
    let ogWidth = null
    let ogHeight = null

    if (project.image) {
      const storagePath = await uploadAsset(project.image, `${project.slug}.webp`)
      const size = await imageSize(project.image)
      ogImagePath = storagePath
      ogWidth = size.width
      ogHeight = size.height
      mediaRows.push({
        kind: 'image',
        storage_path: storagePath,
        poster_path: null,
        width: size.width,
        height: size.height,
        position: 0,
      })
    } else if (project.video && project.poster) {
      const videoPath = await uploadAsset(project.video, `${project.slug}.mp4`)
      const posterPath = await uploadAsset(project.poster, `${project.slug}-poster.webp`)
      const size = await imageSize(project.poster)
      ogImagePath = posterPath
      ogWidth = size.width
      ogHeight = size.height
      mediaRows.push({
        kind: 'video',
        storage_path: videoPath,
        poster_path: posterPath,
        width: size.width,
        height: size.height,
        position: 0,
      })
    }

    const approvedAt = new Date(Date.now() - index * 60 * 60 * 1000).toISOString()
    const { data: creation, error: creationError } = await supabase
      .from('creations')
      .insert({
        author_id: profile.id,
        title: project.title,
        story: project.story,
        prompt: project.prompt,
        live_url: project.liveUrl,
        og_title: project.title,
        og_image_path: ogImagePath,
        og_image_width: ogWidth,
        og_image_height: ogHeight,
        category_id: categoryId,
        status: 'approved',
        approved_at: approvedAt,
      })
      .select('id')
      .single()
    if (creationError) throw creationError

    if (mediaRows.length > 0) {
      const { error: mediaError } = await supabase.from('creation_media').insert(
        mediaRows.map((row) => ({
          ...row,
          creation_id: creation.id,
        })),
      )
      if (mediaError) throw mediaError
    }

    const tagRows = await seedTags(project.tags)
    if (tagRows.length > 0) {
      const { error: tagError } = await supabase.from('creation_tags').insert(
        tagRows.map((tag) => ({
          creation_id: creation.id,
          tag_id: tag.id,
        })),
      )
      if (tagError) throw tagError
    }

    console.log(`Pinned ${project.title} as Dizzy`)
  }

  console.log('Dizzy seed complete')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
