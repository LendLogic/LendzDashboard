import { expect, test } from 'vitest'
import {
  bucketForStatus,
  cleanTitle,
  cleanSubtaskTitle,
  statusFromPercent,
  ANALYZER_KEYS,
  MODULE_ORDER,
  getModuleBoardId,
  getModuleStatusColumnId,
  activeModuleKeys,
  filterStoriesForModule,
  LEXI_BROKER_BOARD_ID,
  SUBITEM_STATUS_COLUMN_ID,
} from './config'
import type { RawStory } from './monday'

const LEXI_IDS = [
  '12451013226',
  '12482521999',
  '12482526623',
  '12451140139',
  '12451122951',
  '12451013290',
  '12451008846',
]

function story(id: string, status = 'Done'): RawStory {
  return { id, name: `Story ${id}`, status, module: null }
}

test('maps Monday statuses to buckets, unknown/blank → remaining', () => {
  expect(bucketForStatus('Done')).toBe('delivered')
  expect(bucketForStatus('In Progress')).toBe('inProgress')
  expect(bucketForStatus('Code Review')).toBe('inProgress')
  expect(bucketForStatus('QA')).toBe('inProgress')
  expect(bucketForStatus('Working on it')).toBe('inProgress')
  expect(bucketForStatus('Ready to start')).toBe('remaining')
  expect(bucketForStatus('Not Started')).toBe('remaining')
  expect(bucketForStatus('Stuck')).toBe('remaining')
  expect(bucketForStatus('')).toBe('remaining')
  expect(bucketForStatus(null)).toBe('remaining')
  expect(bucketForStatus('Whatever')).toBe('remaining')
})

test('derives the status pill from percent thresholds', () => {
  expect(statusFromPercent(65)).toBe('on_track')
  expect(statusFromPercent(64)).toBe('in_progress')
  expect(statusFromPercent(40)).toBe('in_progress')
  expect(statusFromPercent(39)).toBe('early')
})

test('cleanTitle strips sprint and id prefixes but leaves plain titles', () => {
  expect(cleanTitle('S1 · F-Elig-03 · Eligibility results')).toBe('Eligibility results')
  expect(cleanTitle('F-01-06 · Eligibility evaluation')).toBe('Eligibility evaluation')
  expect(cleanTitle('L-GenUI-05 · Direct Agent Field Updates')).toBe('Direct Agent Field Updates')
  expect(cleanTitle('CLTV calculation issue')).toBe('CLTV calculation issue')
})

test('ANALYZER_KEYS are the registry entries flagged as analyzers, in order', () => {
  expect(ANALYZER_KEYS).toEqual(['bank', 'id', 'pl', 'paystub', 'appraisal', 'credit', 'tax', 'tax1040', 'taxbiz', 'k1', 'form1099', 'w2', 'voe', 'title', 'insurance'])
})

test('MODULE_ORDER is the canonical registry order', () => {
  expect(MODULE_ORDER).toEqual(['pe', 'vt', 'uw', 'lexi', 'broker', 'docmagic', 'bank', 'id', 'pl', 'paystub', 'appraisal', 'credit', 'tax', 'tax1040', 'taxbiz', 'k1', 'form1099', 'w2', 'voe', 'title', 'insurance'])
})

test('getModuleStatusColumnId defaults to task_status; broker, lexi, credit and docmagic declare their own', () => {
  expect(getModuleStatusColumnId('pe')).toBe('task_status')
  expect(getModuleStatusColumnId('uw')).toBe('task_status')
  expect(getModuleStatusColumnId('bank')).toBe('task_status')
  expect(getModuleStatusColumnId('broker')).toBe('status')
  expect(getModuleStatusColumnId('lexi')).toBe('status')
  expect(getModuleStatusColumnId('credit')).toBe('color_mm5qegn')
  expect(getModuleStatusColumnId('docmagic')).toBe('color_mm5rstxa')
})

test('getModuleBoardId: default, env override, invalid/unset falls back to default', () => {
  const orig = process.env.ID_MONDAY_PE
  delete process.env.ID_MONDAY_PE
  expect(getModuleBoardId('pe')).toBe(18420951236)
  process.env.ID_MONDAY_PE = 'not-a-number'
  expect(getModuleBoardId('pe')).toBe(18420951236)
  process.env.ID_MONDAY_PE = '0'
  expect(getModuleBoardId('pe')).toBe(18420951236)
  process.env.ID_MONDAY_PE = '999'
  expect(getModuleBoardId('pe')).toBe(999)
  process.env.ID_MONDAY_PE = orig
})

test('getModuleBoardId is null for modules whose board does not exist yet', () => {
  for (const k of ['vt', 'tax'] as const) {
    const env = { vt: 'ID_MONDAY_VT', tax: 'ID_MONDAY_TAX' }[k]
    const orig = process.env[env]
    delete process.env[env]
    expect(getModuleBoardId(k)).toBeNull()
    process.env[env] = orig
  }
})

test('lexi shares the Broker LOS board, so it is board-backed by default', () => {
  const orig = process.env.ID_MONDAY_LEXI
  delete process.env.ID_MONDAY_LEXI
  expect(getModuleBoardId('lexi')).toBe(18420631446)
  if (orig === undefined) delete process.env.ID_MONDAY_LEXI
  else process.env.ID_MONDAY_LEXI = orig
})

test('a hidden module stays out even when a board id arrives — the switch outranks the board', () => {
  const orig = process.env.ID_MONDAY_TAX
  process.env.ID_MONDAY_TAX = '12345'
  expect(getModuleBoardId('tax')).toBe(12345)
  expect(activeModuleKeys()).not.toContain('tax')
  if (orig === undefined) delete process.env.ID_MONDAY_TAX
  else process.env.ID_MONDAY_TAX = orig
})

test('activeModuleKeys are the board-backed, non-hidden modules in canonical order', () => {
  expect(activeModuleKeys()).toEqual([
    'pe',
    'uw',
    'lexi',
    'broker',
    'docmagic',
    'bank',
    'id',
    'pl',
    'paystub',
    'appraisal',
    'credit',
    'tax1040',
    'taxbiz',
    'k1',
    'form1099',
    'w2',
    'voe',
    'title',
    'insurance',
  ])
})

test('every board-backed module is active now that appraisal is visible', () => {
  const boardBacked = MODULE_ORDER.filter((k) => getModuleBoardId(k) != null)
  expect(boardBacked).toContain('appraisal')
  expect(activeModuleKeys()).toEqual(boardBacked)
})

test('appraisal reads its own dedicated board', () => {
  const orig = process.env.ID_MONDAY_APPRAISAL
  delete process.env.ID_MONDAY_APPRAISAL
  expect(getModuleBoardId('appraisal')).toBe(18423914149)
  expect(getModuleStatusColumnId('appraisal')).toBe('task_status')
  if (orig === undefined) delete process.env.ID_MONDAY_APPRAISAL
  else process.env.ID_MONDAY_APPRAISAL = orig
})

test('LEXI_BROKER_BOARD_ID comes from the registry, not a second literal', () => {
  expect(LEXI_BROKER_BOARD_ID).toBe(18420631446)
})

test('filterStoriesForModule routes the Broker LOS board: lexi keeps the seven, broker keeps the complement', () => {
  const lexiStories = LEXI_IDS.map((id) => story(id))
  const brokerStories = [story('99990'), story('99991')]
  const all = [...lexiStories, ...brokerStories]

  const lexi = filterStoriesForModule('lexi', LEXI_BROKER_BOARD_ID!, all)
  expect(lexi.map((s) => s.id).sort()).toEqual([...LEXI_IDS].sort())

  const broker = filterStoriesForModule('broker', LEXI_BROKER_BOARD_ID!, all)
  expect(broker.map((s) => s.id).sort()).toEqual(['99990', '99991'])

  // Exclusive partition: no id appears in both.
  const overlap = lexi.filter((s) => broker.some((b) => b.id === s.id))
  expect(overlap).toEqual([])
})

test('filterStoriesForModule returns the input unchanged on any other board', () => {
  const all = [story('12451013226'), story('99990')]
  expect(filterStoriesForModule('lexi', 12345, all)).toBe(all)
  expect(filterStoriesForModule('broker', 12345, all)).toBe(all)
})

test('filterStoriesForModule returns the input unchanged for an unrelated key on the Broker LOS board', () => {
  const all = [story('12451013226'), story('99990')]
  expect(filterStoriesForModule('pe', LEXI_BROKER_BOARD_ID!, all)).toBe(all)
})

test('SUBITEM_STATUS_COLUMN_ID is the Monday default status column id', () => {
  expect(SUBITEM_STATUS_COLUMN_ID).toBe('status')
})

test('cleanSubtaskTitle strips a hyphenated code prefix but leaves plain colons intact', () => {
  expect(cleanSubtaskTitle('U-02-ID-01: Structured extraction')).toBe('Structured extraction')
  expect(cleanSubtaskTitle('U-05-1099-07: Regression test dataset (delivery requirement)')).toBe(
    'Regression test dataset (delivery requirement)',
  )
  expect(cleanSubtaskTitle('Note: something')).toBe('Note: something')
  expect(cleanSubtaskTitle('Plain title')).toBe('Plain title')
})
