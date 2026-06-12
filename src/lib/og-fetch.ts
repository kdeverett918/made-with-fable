import 'server-only'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import sharp from 'sharp'

const FETCH_TIMEOUT_MS = 5000
const MAX_REDIRECTS = 3
const MAX_HTML_BYTES = 1_000_000
const MAX_IMAGE_BYTES = 5_000_000

export interface OgPreview {
  title: string | null
  imageUrl: string | null
}

export interface OgImage {
  buffer: Buffer
  width: number
  height: number
}

class UnsafeUrlError extends Error {}

function ipv4ToInt(ip: string) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
}

function inCidr(ip: number, base: string, maskBits: number) {
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0
  return (ip & mask) === (ipv4ToInt(base) & mask)
}

const PRIVATE_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]

function isPrivateAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 4) {
    const ip = ipv4ToInt(address)
    return PRIVATE_V4.some(([base, bits]) => inCidr(ip, base, bits))
  }
  if (family === 6) {
    const lower = address.toLowerCase()
    // v4-mapped (::ffff:1.2.3.4)
    const v4 = lower.match(/(\d+\.\d+\.\d+\.\d+)$/)
    if (v4) return isPrivateAddress(v4[1])
    return (
      lower === '::' ||
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb')
    )
  }
  return true
}

/** Validates scheme/port/credentials and resolves DNS, rejecting private ranges. */
async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new UnsafeUrlError('invalid URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('only http(s) URLs are allowed')
  }
  if (url.username || url.password) throw new UnsafeUrlError('credentials not allowed')
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new UnsafeUrlError('non-standard port')
  }

  const host = url.hostname
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new UnsafeUrlError('private address')
    return url
  }

  let addresses
  try {
    addresses = await lookup(host, { all: true })
  } catch {
    throw new UnsafeUrlError('host did not resolve')
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new UnsafeUrlError('private address')
  }
  return url
}

/** Fetch with manual redirects, re-validating every hop against private ranges. */
async function safeFetch(raw: string, accept: string): Promise<Response> {
  let current = raw
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertSafeUrl(current)
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        accept,
        'user-agent': 'MadeWithFableBot/1.0 (+https://made-with-fable.onrender.com)',
      },
    })
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      res.body?.cancel()
      if (!location) throw new Error('redirect without location')
      current = new URL(location, url).toString()
      continue
    }
    return res
  }
  throw new Error('too many redirects')
}

async function readCapped(res: Response, cap: number): Promise<Buffer> {
  const reader = res.body?.getReader()
  if (!reader) return Buffer.alloc(0)
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > cap) {
      await reader.cancel()
      break
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1]
  }
  return null
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
}

/** Fetches a page and extracts og:title / og:image. Returns nulls on any failure. */
export async function fetchOgPreview(pageUrl: string): Promise<OgPreview> {
  try {
    const res = await safeFetch(pageUrl, 'text/html,application/xhtml+xml')
    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok || !contentType.includes('html')) {
      res.body?.cancel()
      return { title: null, imageUrl: null }
    }
    const html = (await readCapped(res, MAX_HTML_BYTES)).toString('utf8')

    const ogTitle =
      extractMeta(html, 'og:title') ?? html.match(/<title[^>]*>([^<]{1,200})/i)?.[1] ?? null
    const ogImage = extractMeta(html, 'og:image') ?? extractMeta(html, 'twitter:image')

    return {
      title: ogTitle ? decodeEntities(ogTitle.trim()).slice(0, 200) : null,
      imageUrl: ogImage ? new URL(decodeEntities(ogImage), pageUrl).toString() : null,
    }
  } catch {
    return { title: null, imageUrl: null }
  }
}

/** Downloads an og:image and normalizes it to a max-1200px webp. Null on any failure. */
export async function downloadOgImage(imageUrl: string): Promise<OgImage | null> {
  try {
    const res = await safeFetch(imageUrl, 'image/*')
    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok || !contentType.startsWith('image/')) {
      res.body?.cancel()
      return null
    }
    const raw = await readCapped(res, MAX_IMAGE_BYTES)
    if (raw.byteLength === 0) return null

    const image = sharp(raw).resize({ width: 1200, withoutEnlargement: true })
    const buffer = await image.webp({ quality: 80 }).toBuffer()
    const meta = await sharp(buffer).metadata()
    if (!meta.width || !meta.height) return null

    return { buffer, width: meta.width, height: meta.height }
  } catch {
    return null
  }
}
