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
