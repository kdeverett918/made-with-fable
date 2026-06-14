/** Returns the URL only if it is a well-formed http(s) URL — guards hrefs against javascript:/data: schemes. */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') return value
  } catch {
    // fall through
  }
  return null
}

/** Display form of an external URL: hostname + path without scheme/www. */
export function displayUrl(value: string): string {
  return value.replace(/^https?:\/\/(www\.)?/, '')
}

/**
 * Makes a user-typed project link "just work": a bare host like `example.com`
 * or `www.foo.dev/x` gets an `https://` scheme prepended so it becomes a valid
 * URL. Anything that already carries a scheme is left as-is; empty stays empty.
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
  return hasScheme ? trimmed : `https://${trimmed}`
}

/** True when the (already-normalized) string parses as an http(s) URL. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
