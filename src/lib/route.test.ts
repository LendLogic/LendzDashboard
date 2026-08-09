import { expect, test } from 'vitest'
import { formatHash, parseHash } from './route'

test('reads a section and a module out of the hash', () => {
  expect(parseHash('#/analyzers/bank')).toEqual({ section: 'analyzers', key: 'bank' })
  expect(parseHash('#/delivery/pe')).toEqual({ section: 'delivery', key: 'pe' })
})

test('a section on its own leaves the module unset, for the section default', () => {
  expect(parseHash('#/analyzers')).toEqual({ section: 'analyzers', key: null })
  expect(parseHash('#/analyzers/')).toEqual({ section: 'analyzers', key: null })
})

// A pasted link is untrusted input: it decides what renders, so it cannot throw
// and it cannot leave the console on a section that does not exist.
test('anything unparseable yields no route at all', () => {
  for (const hash of ['', '#', '#/', 'nonsense', '#analyzers', '#//bank']) {
    expect(parseHash(hash)).toBeNull()
  }
})

test('ignores extra segments rather than guessing at them', () => {
  expect(parseHash('#/analyzers/bank/extra')).toEqual({ section: 'analyzers', key: 'bank' })
})

test('decodes a key that had to be escaped', () => {
  expect(parseHash('#/delivery/p%26l')).toEqual({ section: 'delivery', key: 'p&l' })
})

test('formatHash round-trips through parseHash', () => {
  for (const [section, key] of [['analyzers', 'bank'], ['delivery', 'pe'], ['analyzers', 'overview']]) {
    expect(parseHash(formatHash(section, key))).toEqual({ section, key })
  }
  expect(formatHash('analyzers', 'bank')).toBe('#/analyzers/bank')
})

test('formatHash escapes a key so it survives the round trip', () => {
  expect(parseHash(formatHash('delivery', 'p&l'))).toEqual({ section: 'delivery', key: 'p&l' })
})
