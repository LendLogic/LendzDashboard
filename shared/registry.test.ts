import { expect, test } from 'vitest'
import {
  ANALYZER_FAMILIES,
  FAMILY_LABEL,
  MODULE_REGISTRY,
  analyzerFamily,
  isActiveEntry,
  moduleEnvVar,
  moduleStatusColumn,
  toBaselineModule,
} from './registry'
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

// A badge reading "Awaiting board data" beside a 77% bar contradicts itself.
// The generic default has to agree with whether a figure is actually there.
test('the default assumed label distinguishes an asserted figure from a missing one', () => {
  expect(toBaselineModule({ key: 'a', name: 'A', baseline: { percent: 77 } }).assumedLabel)
    .toBe('Figures asserted')
  expect(toBaselineModule({ key: 'b', name: 'B' }).assumedLabel).toBe('Awaiting board data')
  // an authored label always wins
  expect(toBaselineModule({ key: 'c', name: 'C', baseline: { percent: 30, assumedLabel: 'Scaffolding done' } }).assumedLabel)
    .toBe('Scaffolding done')
})

test('bank carries an asserted label, since it has a baseline figure', () => {
  expect(toBaselineModule(entryFor('bank')).assumedLabel).toBe('Figures asserted')
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

test('docmagic is a delivery module, not an analyzer, and declares its status column', () => {
  const docmagic = entryFor('docmagic')
  expect(docmagic.analyzer).toBeUndefined()
  expect(ANALYZER_KEYS).not.toContain('docmagic')
  expect(docmagic.board).toBe(18424466007)
  expect(moduleStatusColumn(docmagic)).toBe('color_mm5rstxa')
  expect(docmagic.hidden).toBeUndefined()
  expect(isActiveEntry(docmagic, docmagic.board!)).toBe(true)
})

test('credit ships visible, reading its board through its own status column', () => {
  const credit = entryFor('credit')
  expect(credit.analyzer).toBe(true)
  expect(credit.board).toBe(18424174374)
  expect(moduleStatusColumn(credit)).toBe('color_mm5qegn')
  expect(credit.hidden).toBeUndefined()
  expect(isActiveEntry(credit, credit.board!)).toBe(true)
  expect(credit.sub).toBe('Direct credit data retrieval from bureau providers.')
  expect(credit.brief).toEqual({ goNoGo: 'Aug 3', goLive: 'Aug 8' })
  expect(ANALYZER_KEYS).toContain('credit')
})

test('appraisal carries its own sub and milestone dates', () => {
  const appraisal = entryFor('appraisal')
  expect(appraisal.sub).toBe(
    'Property valuation and collateral data extraction from appraisal reports.',
  )
  expect(appraisal.brief).toEqual({ goNoGo: 'Aug 3', goLive: 'Aug 8' })
})

test('vt is hidden on both counts: no board and the explicit switch', () => {
  expect(entryFor('vt').board ?? null).toBeNull()
  expect(entryFor('vt').hidden).toBe(true)
})

test('hidden takes a module out even with a board id; without a board there is nothing to read', () => {
  const entry = { key: 'demo', name: 'Demo' }
  expect(isActiveEntry(entry, 123)).toBe(true)
  expect(isActiveEntry({ ...entry, hidden: true }, 123)).toBe(false)
  expect(isActiveEntry({ ...entry, hidden: false }, 123)).toBe(true)
  expect(isActiveEntry(entry, null)).toBe(false)
  expect(isActiveEntry({ ...entry, hidden: true }, null)).toBe(false)
})

test('exactly vt ships hidden', () => {
  expect(MODULE_REGISTRY.filter((e) => e.hidden).map((e) => e.key)).toEqual(['vt'])
})

test('every registry key is unique', () => {
  const keys = MODULE_REGISTRY.map((e) => e.key)
  expect(new Set(keys).size).toBe(keys.length)
})

// Progress encodes magnitude with a single hue. A per-module colour encoded
// nothing and was never validated for colour-vision deficiency.
test('no entry carries a per-module accent colour', () => {
  expect(MODULE_REGISTRY.filter((e) => 'accentColor' in e).map((e) => e.key)).toEqual([])
})

// The index groups analyzers by family. An analyzer with no family would group
// under nothing and silently vanish from the navigation.
test('every analyzer declares a family, and no delivery module does', () => {
  const missing = MODULE_REGISTRY.filter((e) => e.analyzer && !e.family).map((e) => e.key)
  expect(missing).toEqual([])
  const stray = MODULE_REGISTRY.filter((e) => !e.analyzer && e.family).map((e) => e.key)
  expect(stray).toEqual([])
})

test('the family order is the loan-file reading order and every family has a label', () => {
  expect(ANALYZER_FAMILIES).toEqual(['borrower', 'property', 'financials'])
  expect(Object.keys(FAMILY_LABEL).sort()).toEqual([...ANALYZER_FAMILIES].sort())
  expect(FAMILY_LABEL.borrower).toBe('Borrower')
  expect(FAMILY_LABEL.property).toBe('Property')
  expect(FAMILY_LABEL.financials).toBe('Financials')
})

// Every "Analyzers:" board in Monday folder 20849229 (LendLogic > Underwriting).
// Read off the folder rather than guessed, so a drift here is a real drift.
const ANALYZER_BOARDS: ReadonlyArray<readonly [string, number]> = [
  ['bank', 18420951194],
  ['id', 18420951197],
  ['pl', 18420951201],
  ['paystub', 18420951200],
  ['appraisal', 18423914149],
  ['credit', 18424174374],
  ['tax1040', 18425100702],
  ['taxbiz', 18425100840],
  ['k1', 18425100779],
  ['form1099', 18425100610],
  ['w2', 18425100540],
  ['voe', 18425101091],
  ['title', 18425100915],
  ['insurance', 18425101014],
]

test('every Analyzers board in the Underwriting folder has an entry, wired to its own board', () => {
  for (const [key, board] of ANALYZER_BOARDS) {
    const entry = entryFor(key)
    expect(entry.analyzer).toBe(true)
    expect(entry.board).toBe(board)
    expect(isActiveEntry(entry, entry.board!)).toBe(true)
  }
})

test('no two analyzers point at the same board', () => {
  const boards = ANALYZER_BOARDS.map(([, b]) => b)
  expect(new Set(boards).size).toBe(boards.length)
})

// Broker LOS is the one board deliberately shared, by two delivery modules.
test('the new analyzer boards all read the default status column', () => {
  for (const key of ['tax1040', 'taxbiz', 'k1', 'form1099', 'w2', 'voe', 'title', 'insurance']) {
    expect(moduleStatusColumn(entryFor(key))).toBe('task_status')
    expect(entryFor(key).statusColumn).toBeUndefined()
  }
})

test('the fourteen shipping analyzers spread across the three families', () => {
  const shipping = MODULE_REGISTRY.filter((e) => e.analyzer && e.hidden !== true)
  expect(shipping).toHaveLength(14)
  const byFamily = (f: string) => shipping.filter((e) => e.family === f).map((e) => e.key)
  expect(byFamily('borrower')).toEqual(['id', 'credit'])
  expect(byFamily('property')).toEqual(['appraisal', 'title', 'insurance'])
  expect(byFamily('financials')).toEqual(
    ['bank', 'pl', 'paystub', 'tax1040', 'taxbiz', 'k1', 'form1099', 'w2', 'voe'],
  )
})

test('an analyzer sorts into its evidence family', () => {
  expect(analyzerFamily('id')).toBe('borrower')
  expect(analyzerFamily('credit')).toBe('borrower')
  expect(analyzerFamily('appraisal')).toBe('property')
  expect(analyzerFamily('bank')).toBe('financials')
  expect(analyzerFamily('paystub')).toBe('financials')
  expect(analyzerFamily('pl')).toBe('financials')
  expect(analyzerFamily('tax1040')).toBe('financials')
})

test('a delivery module and an unknown key have no family', () => {
  expect(analyzerFamily('pe')).toBeNull()
  expect(analyzerFamily('nope')).toBeNull()
})
