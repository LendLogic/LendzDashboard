import { expect, test } from 'vitest'
import { analyzerAggregate, groupByFamily, partitionModules, globalAnalyzerPercent, shortLabel } from './analyzers'
import type { Module } from '../../shared/readiness'

const mk = (key: string, d: number, ip: number, r: number): Module => ({
  key,
  name: key,
  sub: '',
  phase: 'delivery',
  percent: 0,
  status: 'early',
  statusLabel: '',
  note: '',
  targetDate: '',
  dateConfidence: 'projected',
  assumed: false,
  counts: { delivered: d, inProgress: ip, remaining: r },
  buckets: { delivered: [], inProgress: [], remaining: [] },
}) as Module

test('partitionModules splits delivery vs analyzers, analyzers in canonical order', () => {
  const modules = [
    mk('pe', 0, 0, 0), mk('bank', 0, 0, 0), mk('id', 0, 0, 0), mk('pl', 0, 0, 0),
    mk('paystub', 0, 0, 0), mk('w2', 0, 0, 0), mk('vt', 0, 0, 0),
  ]
  const { delivery, analyzers } = partitionModules(modules)
  expect(delivery.map((m) => m.key)).toEqual(['pe', 'vt'])
  expect(analyzers.map((m) => m.key)).toEqual(['bank', 'id', 'pl', 'paystub', 'w2'])
})

test('globalAnalyzerPercent is story-weighted across analyzers, in-progress at half credit', () => {
  const analyzers = [mk('bank', 2, 0, 1), mk('id', 0, 1, 2)]
  expect(globalAnalyzerPercent(analyzers)).toBe(42) // (2 + 0.5·1) / 6
})

test('globalAnalyzerPercent is 0 when there are no stories', () => {
  expect(globalAnalyzerPercent([mk('bank', 0, 0, 0)])).toBe(0)
})

test('globalAnalyzerPercent excludes assumed modules from the weighted sum', () => {
  const live = mk('bank', 2, 0, 1)          // 2/3 real
  const assumed = { ...mk('w2', 1, 1, 3), assumed: true } as Module
  expect(globalAnalyzerPercent([live, assumed])).toBe(67) // 2/3 only; the assumed module ignored
})

test('globalAnalyzerPercent is 0 when every analyzer is assumed', () => {
  const a = { ...mk('bank', 1, 1, 1), assumed: true } as Module
  const b = { ...mk('id', 2, 0, 0), assumed: true } as Module
  expect(globalAnalyzerPercent([a, b])).toBe(0)
})

// The rows already say "not measured" one at a time. An aggregate over nothing
// measured is the same statement, and reporting it as 0% next to a row showing
// 77 is the contradiction this fixes.
test('analyzerAggregate is unmeasured when no analyzer came off a board', () => {
  const a = { ...mk('bank', 1, 1, 1), assumed: true } as Module
  const b = { ...mk('id', 2, 0, 0), assumed: true } as Module
  expect(analyzerAggregate([a, b])).toEqual({ percent: 0, provenance: 'unmeasured' })
  expect(analyzerAggregate([])).toEqual({ percent: 0, provenance: 'unmeasured' })
})

test('analyzerAggregate reports a measured percent as soon as one board counts', () => {
  const live = mk('bank', 2, 0, 1)
  const assumed = { ...mk('w2', 1, 1, 3), assumed: true } as Module
  expect(analyzerAggregate([live, assumed])).toEqual({ percent: 67, provenance: 'measured' })
})

// A board whose stories are all still open is a real zero, not a missing one.
test('analyzerAggregate keeps a measured zero measured', () => {
  expect(analyzerAggregate([mk('bank', 0, 0, 3)])).toEqual({ percent: 0, provenance: 'measured' })
})

// The index sits under an "Analyzers" heading, so repeating the word on all
// sixteen rows is what pushed the column past 260px in the first place.
test('shortLabel drops a trailing Analyzer, and leaves every other name alone', () => {
  expect(shortLabel('Bank Statement Analyzer')).toBe('Bank Statement')
  expect(shortLabel('ID Analyzer')).toBe('ID')
  expect(shortLabel('Tax Return Analyzer')).toBe('Tax Return')
  expect(shortLabel('Pricing & Eligibility')).toBe('Pricing & Eligibility')
  expect(shortLabel('Analyzer')).toBe('Analyzer')
  expect(shortLabel('Analyzer Framework')).toBe('Analyzer Framework')
})

test('groupByFamily returns sections in family order, each in registry order', () => {
  const analyzers = [mk('bank', 0, 0, 0), mk('id', 0, 0, 0), mk('appraisal', 0, 0, 0), mk('paystub', 0, 0, 0), mk('credit', 0, 0, 0)]
  expect(groupByFamily(analyzers).map((s) => [s.family, s.label, s.modules.map((m) => m.key)])).toEqual([
    ['borrower', 'Borrower', ['id', 'credit']],
    ['property', 'Property', ['appraisal']],
    ['financials', 'Financials', ['bank', 'paystub']],
  ])
})

// A heading with nothing under it is noise, and half the families sit empty
// until the remaining analyzers get boards.
test('groupByFamily drops families with no modules', () => {
  expect(groupByFamily([mk('appraisal', 0, 0, 0)]).map((s) => s.family)).toEqual(['property'])
  expect(groupByFamily([])).toEqual([])
})

test('partitionModules skips analyzer keys missing from the payload', () => {
  const modules = [mk('pe',0,0,0), mk('bank',0,0,0), mk('id',0,0,0), mk('w2',0,0,0)]
  const { delivery, analyzers } = partitionModules(modules)
  expect(delivery.map((m) => m.key)).toEqual(['pe'])
  expect(analyzers.map((m) => m.key)).toEqual(['bank', 'id', 'w2']) // pl/paystub absent, no undefined
})
