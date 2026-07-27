import { expect, test } from 'vitest'
import { MODULE_REGISTRY, moduleEnvVar, moduleStatusColumn, toBaselineModule } from './registry'
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

test('appraisal is a registered analyzer, hidden until its board id arrives', () => {
  const appraisal = entryFor('appraisal')
  expect(appraisal.analyzer).toBe(true)
  expect(appraisal.board ?? null).toBeNull()
  expect(ANALYZER_KEYS).toContain('appraisal')
})

test('every registry key is unique', () => {
  const keys = MODULE_REGISTRY.map((e) => e.key)
  expect(new Set(keys).size).toBe(keys.length)
})
