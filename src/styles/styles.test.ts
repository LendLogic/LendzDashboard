import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { test, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(__dirname, './app.css'), 'utf8')

const TOKEN_BLOCK = /:root\s*\{([\s\S]*?)\n\s*\}/

test('app.css contains the core PoC classes', () => {
  for (const cls of ['.masthead', '.tabs', '.panel', '.modband', '.bucket', '.bignum', '.fill']) {
    expect(css).toContain(cls)
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
