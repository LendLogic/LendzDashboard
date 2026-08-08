import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import { buildPayload } from '../shared/readiness'
import type { Module, ReadinessPayload } from '../shared/readiness'

vi.mock('./api', () => ({
  fetchReadiness: vi.fn(() => Promise.resolve(buildPayload('2026-06-17T14:00:00Z'))),
}))

afterEach(() => vi.clearAllMocks())

const mod = (
  key: string,
  name: string,
  percent: number,
  counts = { delivered: 0, inProgress: 0, remaining: 0 },
): Module => ({
  key,
  name,
  sub: '',
  phase: 'delivery',
  percent,
  status: 'on_track',
  statusLabel: 'On track',
  note: '',
  targetDate: '',
  dateConfidence: 'committed',
  assumed: false,
  counts,
  buckets: { delivered: [], inProgress: [], remaining: [] },
})

const payloadOf = (modules: Module[]): ReadinessPayload => ({
  asOf: '2026-06-17T14:00:00Z',
  source: 'live',
  modules,
})

async function serve(payload: ReadinessPayload) {
  const { fetchReadiness } = await import('./api')
  vi.mocked(fetchReadiness).mockResolvedValueOnce(payload)
}

test('renders the first module, then navigates into the Analyzers section', async () => {
  render(<App />)
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
  await userEvent.click(screen.getByRole('button', { name: 'Analyzers' }))
  await waitFor(() => expect(screen.getByText('Analyzer readiness')).toBeInTheDocument())
  // The index groups by evidence family, in loan-file order, and skips the empty one.
  expect(screen.getByText('Borrower')).toBeInTheDocument()
  expect(screen.getByText('Property')).toBeInTheDocument()
  expect(screen.getByText('Financials')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('tab', { name: /Bank Statement/ }))
  // The index row drops the redundant suffix; the detail header keeps the full name.
  await waitFor(() => expect(screen.getByText('Bank Statement Analyzer')).toBeInTheDocument())
  expect(screen.getByRole('tab', { name: 'Bank Statement 77' })).toBeInTheDocument()
})

test('a registry-only analyzer renders its card with no component changes', async () => {
  render(<App />)
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
  await userEvent.click(screen.getByRole('button', { name: 'Analyzers' }))
  await userEvent.click(screen.getByRole('tab', { name: /Appraisal/ }))
  await waitFor(() => expect(screen.getByText('Appraisal Analyzer')).toBeInTheDocument())
  expect(screen.getByText('Awaiting board data')).toBeInTheDocument()
})

test('a module below the 10% floor gets no tab, no card and no rollup weight', async () => {
  await serve(payloadOf([
    mod('pe', 'Pricing & Eligibility', 50, { delivered: 1, inProgress: 0, remaining: 1 }),
    mod('uw', 'Underwriting', 5, { delivered: 1, inProgress: 0, remaining: 19 }),
    mod('bank', 'Bank Statement Analyzer', 67, { delivered: 2, inProgress: 0, remaining: 1 }),
    mod('id', 'ID Analyzer', 5, { delivered: 0, inProgress: 1, remaining: 9 }),
  ]))
  render(<App />)
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
  expect(screen.queryByRole('tab', { name: /Underwriting/ })).toBeNull()
  expect(screen.queryByText('Underwriting')).toBeNull()

  await userEvent.click(screen.getByRole('button', { name: 'Analyzers' }))
  await waitFor(() => expect(screen.getByText('Analyzer readiness')).toBeInTheDocument())
  expect(screen.queryByRole('tab', { name: /^ID$/ })).toBeNull()
  const rollup = screen.getByText('Analyzer readiness').parentElement!
  expect(rollup.textContent).toContain('67%')
  expect(rollup.textContent).toContain('Combined across 1 analyzers')
})

test('the Analyzers tab disappears when no analyzer clears the floor', async () => {
  await serve(payloadOf([
    mod('pe', 'Pricing & Eligibility', 50, { delivered: 1, inProgress: 0, remaining: 1 }),
    mod('bank', 'Bank Statement Analyzer', 5, { delivered: 0, inProgress: 1, remaining: 9 }),
  ]))
  render(<App />)
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
  expect(screen.queryByRole('button', { name: 'Analyzers' })).toBeNull()
})

test('opens on the Analyzers section when every delivery module is below the floor', async () => {
  await serve(payloadOf([
    mod('pe', 'Pricing & Eligibility', 5, { delivered: 1, inProgress: 0, remaining: 19 }),
    mod('bank', 'Bank Statement Analyzer', 67, { delivered: 2, inProgress: 0, remaining: 1 }),
  ]))
  render(<App />)
  await waitFor(() => expect(screen.getByText('Analyzer readiness')).toBeInTheDocument())
  expect(screen.queryByRole('tab', { name: /Pricing & Eligibility/ })).toBeNull()
  expect(screen.getByRole('button', { name: 'Analyzers' })).toBeInTheDocument()
})

test('shows an empty state when no module clears the floor', async () => {
  await serve(payloadOf([
    mod('pe', 'Pricing & Eligibility', 5),
    mod('bank', 'Bank Statement Analyzer', 0),
  ]))
  render(<App />)
  await waitFor(() => expect(screen.getByText(/No modules are above 10%/)).toBeInTheDocument())
  expect(screen.queryAllByRole('tab')).toHaveLength(0)
})

test('shows an error card when the fetch fails', async () => {
  const { fetchReadiness } = await import('./api')
  vi.mocked(fetchReadiness).mockRejectedValueOnce(new Error('boom'))
  render(<App />)
  await waitFor(() => expect(screen.getByText(/Could not load the console/)).toBeInTheDocument())
})
