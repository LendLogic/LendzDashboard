import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AnalyzersOverview } from './AnalyzersOverview'
import type { Module } from '../../shared/readiness'

const mk = (key: string, name: string, percent: number, d: number, ip: number, r: number, assumed = false): Module =>
  ({
    key, name, sub: '', phase: 'delivery', percent,
    status: 'on_track', statusLabel: 'On track', note: '', targetDate: '',
    dateConfidence: 'committed', assumed,
    counts: { delivered: d, inProgress: ip, remaining: r },
    buckets: { delivered: [], inProgress: [], remaining: [] },
  }) as Module

// id and credit are borrower, appraisal is property, bank is financials.
const analyzers = [
  mk('bank', 'Bank Statement Analyzer', 67, 2, 0, 1),
  mk('id', 'ID Analyzer', 30, 0, 1, 2),
  mk('appraisal', 'Appraisal Analyzer', 75, 3, 0, 1),
  mk('credit', 'Credit Report Analyzer', 40, 2, 0, 3),
]

test('shows the rollup and one row per analyzer, without the redundant suffix', () => {
  render(<AnalyzersOverview analyzers={analyzers} onSelect={() => {}} />)
  expect(screen.getByText('Analyzer readiness')).toBeInTheDocument()
  expect(screen.getByText('Bank Statement')).toBeInTheDocument()
  expect(screen.getByText('ID')).toBeInTheDocument()
})

// The index and the detail panel both group by family. A grid of cards was a
// third way of showing the same set, and most cards carried nothing but a name.
test('rows are grouped by family, in the same order as the index', () => {
  render(<AnalyzersOverview analyzers={analyzers} onSelect={() => {}} />)
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent))
    .toEqual(['Borrower', 'Property', 'Financials'])
})

test('a family heading carries how many analyzers sit under it', () => {
  render(<AnalyzersOverview analyzers={analyzers} onSelect={() => {}} />)
  const borrower = screen.getByRole('heading', { name: 'Borrower' }).parentElement!
  expect(borrower.textContent).toContain('2')
})

test('clicking a row selects that analyzer', async () => {
  const onSelect = vi.fn()
  render(<AnalyzersOverview analyzers={analyzers} onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: /^ID/ }))
  expect(onSelect).toHaveBeenCalledWith('id')
})

test('every row states its status in words, never by colour alone', () => {
  render(<AnalyzersOverview analyzers={analyzers} onSelect={() => {}} />)
  expect(screen.getAllByText('On track')).toHaveLength(analyzers.length)
})

// The clause claimed a remainder even when every analyzer was measured, which
// is the ordinary case in production.
test('the rollup note names no remainder when every analyzer is measured', () => {
  const { container } = render(<AnalyzersOverview analyzers={analyzers} onSelect={() => {}} />)
  const note = container.querySelector('.note')!
  expect(note.textContent).toMatch(/all 4 analyzers/i)
  expect(note.textContent).not.toMatch(/the rest/i)
})

test('the rollup note names the remainder when some analyzer is not measured', () => {
  const { container } = render(<AnalyzersOverview analyzers={[analyzers[0], mk('pl', 'P&L Analyzer', 0, 0, 0, 0, true)]} onSelect={() => {}} />)
  const note = container.querySelector('.note')!
  expect(note.textContent).toMatch(/1 of 2/i)
  expect(note.textContent).toMatch(/the rest/i)
})

test('an unmeasured row reads as not measured and carries no meter', () => {
  render(<AnalyzersOverview analyzers={[analyzers[0], mk('pl', 'P&L Analyzer', 0, 0, 0, 0, true)]} onSelect={() => {}} />)
  const row = screen.getByRole('button', { name: /P&L/ })
  expect(within(row).getByText('Not measured')).toBeInTheDocument()
  expect(row.querySelector('[role="progressbar"]')).toBeNull()
})

// Blobs written before the accent colours were retired still carry the field.
test('a stale accent colour never reaches the DOM', () => {
  const stale = [{ ...analyzers[0], accentColor: '#123456' } as Module]
  const { container } = render(<AnalyzersOverview analyzers={stale} onSelect={() => {}} />)
  for (const row of container.querySelectorAll('.analyzer-row')) {
    expect(row.getAttribute('style')).toBeNull()
  }
  for (const bar of screen.getAllByRole('progressbar')) {
    expect(bar.style.background).toBe('')
  }
})
