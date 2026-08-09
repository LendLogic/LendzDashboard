export interface Route {
  section: string
  // Unset means "whatever this section opens on", so a bare #/analyzers is a
  // valid link rather than a broken one.
  key: string | null
}

// The hash decides what renders and arrives from a pasted link, so it is treated
// as untrusted: anything unparseable yields no route and the console falls back
// to its own defaults instead of showing a section that does not exist.
export function parseHash(hash: string): Route | null {
  const match = /^#\/([^/]+)(?:\/([^/]*))?/.exec(hash)
  if (!match) return null
  const section = safeDecode(match[1])
  if (!section) return null
  const key = match[2] ? safeDecode(match[2]) : null
  return { section, key: key || null }
}

export function formatHash(section: string, key: string): string {
  return `#/${encodeURIComponent(section)}/${encodeURIComponent(key)}`
}

function safeDecode(part: string): string {
  try {
    return decodeURIComponent(part)
  } catch {
    // A malformed escape such as %E0%A4%A is a broken link, not a crash.
    return part
  }
}
