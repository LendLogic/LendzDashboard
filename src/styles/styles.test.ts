import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { test, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(__dirname, './app.css'), 'utf8')

const TOKEN_BLOCK = /:root\s*\{([\s\S]*?)\n\s*\}/

test('app.css contains the core layout and panel classes', () => {
  for (const cls of ['.shell', '.rail', '.index', '.canvas', '.masthead', '.panel', '.modband', '.bucket', '.bignum', '.fill']) {
    expect(css).toContain(cls)
  }
})

// A media query of equal specificity placed above a base rule loses to it. The
// three-column card rows kept overflowing a phone for exactly that reason, so
// every width override belongs after the last base rule.
test('the width media queries come after every base rule', () => {
  const firstWidthQuery = css.search(/@media \(max-width/)
  expect(firstWidthQuery).toBeGreaterThan(-1)
  const after = css.slice(firstWidthQuery)
  // Nothing outside a media block may follow: strip the blocks and expect only
  // comments and whitespace left over.
  const leftovers = after
    .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
  expect(leftovers).toBe('')
})

// A grid column never shrinks below its content, so a three-column row of cards
// overflowed the viewport on a phone and the whole page scrolled sideways.
test('the multi-column card grids collapse at phone width', () => {
  const narrow = css.match(/@media \(max-width: 720px\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''
  expect(narrow).toMatch(/\.row3[^{]*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/)
  expect(narrow).toMatch(/\.buckets|\.row3, \.buckets/)
})

test('the rail drops its fixed item width once it becomes a horizontal bar', () => {
  const bar = css.match(/@media \(max-width: 900px\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''
  expect(bar).toMatch(/\.rail-item[^{]*\{[^}]*width:\s*auto/)
  expect(bar).toMatch(/flex-direction:\s*row/)
})

// The pill tabs are gone with the component. Orphaned rules for a retired
// component are the CSS equivalent of dead code.
test('no rules survive for the retired tab navigation', () => {
  for (const cls of ['.tabs', '.tab ', '.tab.', '.tab:', '.subnav']) {
    expect(css).not.toContain(cls)
  }
})

test('Archivo is self-hosted, not pulled from a third-party CDN', () => {
  expect(css).toMatch(/@font-face/)
  expect(css).toContain("url('/fonts/archivo-latin-var.woff2')")
  expect(css).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com|@import\s+url/)
  expect(existsSync(join(__dirname, '../../public/fonts/archivo-latin-var.woff2'))).toBe(true)
})

test('the token block declares every palette role the design depends on', () => {
  const tokens = css.match(TOKEN_BLOCK)?.[1] ?? ''
  for (const token of [
    '--navy', '--plane', '--card', '--rule',
    '--ink', '--ink-2', '--ink-muted', '--ink-faint',
    '--measure', '--measure-track',
    // No --status-serious: nothing in the Status union maps to it.
    '--status-good', '--status-warning', '--status-critical',
  ]) {
    expect(tokens).toContain(`${token}:`)
  }
})

// The palette is only a system if nothing bypasses it. Eight per-module accent
// colours got in precisely because raw hex was allowed anywhere.
test('no raw hex colour is declared outside the token block', () => {
  const stray = css.replace(TOKEN_BLOCK, '').match(/#[0-9a-fA-F]{3,8}\b/g)
  expect(stray ?? []).toEqual([])
})

// --ink-faint measures 2.58:1 on the card, below the 4.5:1 floor for body copy
// at any size. Decorative pseudo-element markers may wear it — a list bullet
// should recede behind its own text — but content-bearing text may not.
test('the faint ink dresses only decorative markers, never content text', () => {
  const textual = css
    .split('}')
    .filter((r) => /var\(--ink-faint\)/.test(r) && /(^|[\s;{])color\s*:/.test(r))
    .filter((r) => !/::(before|after)/.test(r))
  expect(textual).toEqual([])
})
