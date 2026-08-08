import { expect, test } from 'vitest'
import { provenanceOf } from './provenance'
import type { Module } from '../../shared/readiness'

const mod = (percent: number, assumed: boolean): Module => ({
  key: 'x', name: 'X', sub: '', phase: 'delivery', percent,
  status: 'early', statusLabel: '', note: '', targetDate: '',
  dateConfidence: 'projected', assumed,
  counts: { delivered: 0, inProgress: 0, remaining: 0 },
  buckets: { delivered: [], inProgress: [], remaining: [] },
}) as Module

test('a figure read off a board is measured', () => {
  expect(provenanceOf(mod(71, false))).toBe('measured')
})

// A board that has every story still open really is at zero. Only an absent
// measurement is unknown, so a measured zero must not read as "no data".
test('a measured zero stays measured', () => {
  expect(provenanceOf(mod(0, false))).toBe('measured')
})

test('a hand-written baseline figure is asserted', () => {
  expect(provenanceOf(mod(77, true))).toBe('asserted')
})

test('an assumed module with no figure at all is unmeasured', () => {
  expect(provenanceOf(mod(0, true))).toBe('unmeasured')
})
