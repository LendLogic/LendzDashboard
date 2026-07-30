import { expect, test } from 'vitest'
import { MODULE_REGISTRY, isActiveEntry, moduleEnvVar, moduleStatusColumn, toBaselineModule } from './registry'
import { ANALYZER_KEYS } from './readiness'

function entryFor(key: string) {
  return MODULE_REGISTRY.find((e) => e.key === key)!
}

test('a bare analyzer entry yields a complete, renderable assumed card', () => {
  expect(toBaselineModule({ key: 'demo', name: 'Demo Analyzer', analyzer: true })).toEqual({
    key: 'demo',
    name: 'Demo Analyzer',
    sub: 'Document-extraction analyzer. Build progress from the Analyzers workstream.',
    phase: 'delivery',
    percent: 0,
    status: 'early',
    statusLabel: 'Early build',
    note: 'Dedicated board just seeded. Figures assumed until stories land.',
    targetDate: 'Release Two',
    dateConfidence: 'projected',
    assumed: true,
    assumedLabel: 'Awaiting board data',
    counts: { delivered: 0, inProgress: 0, remaining: 0 },
    buckets: { delivered: [], inProgress: [], remaining: [] },
  })
})

test('a delivery entry gets the delivery sub, not the analyzer one', () => {
  const card = toBaselineModule({ key: 'demo', name: 'Demo' })
  expect(card.sub).toBe('Delivery module. Build progress from its dedicated Monday board.')
})

test('a non-assumed baseline carries no assumed label', () => {
  const card = toBaselineModule({ key: 'demo', name: 'Demo', baseline: { assumed: false } })
  expect(card.assumed).toBe(false)
  expect(card.assumedLabel).toBeUndefined()
})

test('env var derives from the key unless the entry declares one', () => {
  expect(moduleEnvVar({ key: 'appraisal', name: 'Appraisal Analyzer' })).toBe('ID_MONDAY_APPRAISAL')
  expect(moduleEnvVar({ key: 'demo', name: 'Demo', envVar: 'CUSTOM_BOARD' })).toBe('CUSTOM_BOARD')
})

test('status column defaults to task_status; broker and lexi declare status', () => {
  expect(moduleStatusColumn({ key: 'demo', name: 'Demo' })).toBe('task_status')
  expect(moduleStatusColumn(entryFor('broker'))).toBe('status')
  expect(moduleStatusColumn(entryFor('lexi'))).toBe('status')
})

test('appraisal ships visible, reading its own board', () => {
  const appraisal = entryFor('appraisal')
  expect(appraisal.analyzer).toBe(true)
  expect(appraisal.board).toBe(18423914149)
  expect(moduleStatusColumn(appraisal)).toBe('task_status')
  expect(appraisal.hidden).toBeUndefined()
  expect(isActiveEntry(appraisal, appraisal.board!)).toBe(true)
  expect(ANALYZER_KEYS).toContain('appraisal')
})

test('appraisal carries its own sub and milestone dates', () => {
  const appraisal = entryFor('appraisal')
  expect(appraisal.sub).toBe(
    'Property valuation and collateral data extraction from appraisal reports.',
  )
  expect(appraisal.brief).toEqual({ goNoGo: 'Aug 3', goLive: 'Aug 8' })
})

test('vt and tax are hidden on both counts: no board and the explicit switch', () => {
  for (const key of ['vt', 'tax']) {
    expect(entryFor(key).board ?? null).toBeNull()
    expect(entryFor(key).hidden).toBe(true)
  }
})

test('hidden takes a module out even with a board id; without a board there is nothing to read', () => {
  const entry = { key: 'demo', name: 'Demo' }
  expect(isActiveEntry(entry, 123)).toBe(true)
  expect(isActiveEntry({ ...entry, hidden: true }, 123)).toBe(false)
  expect(isActiveEntry({ ...entry, hidden: false }, 123)).toBe(true)
  expect(isActiveEntry(entry, null)).toBe(false)
  expect(isActiveEntry({ ...entry, hidden: true }, null)).toBe(false)
})

test('exactly vt and tax ship hidden', () => {
  expect(MODULE_REGISTRY.filter((e) => e.hidden).map((e) => e.key)).toEqual(['vt', 'tax'])
})

test('every registry key is unique', () => {
  const keys = MODULE_REGISTRY.map((e) => e.key)
  expect(new Set(keys).size).toBe(keys.length)
})
