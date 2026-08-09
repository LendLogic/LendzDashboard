import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { buildPayload } from '../shared/readiness'
import type { Module, ReadinessPayload } from '../shared/readiness'

vi.mock('./api', () => ({
  fetchReadiness: vi.fn(() => Promise.resolve(buildPayload('2026-06-17T14:00:00Z'))),
}))

// What is on screen now lives in the URL, and jsdom keeps one location per file,
// so a test that navigates would otherwise decide where the next one opens.
beforeEach(() => { window.location.hash = '' })
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
  const index = within(screen.getByRole('tablist', { name: 'Analyzers' }))
  expect(index.getByText('Borrower')).toBeInTheDocument()
  expect(index.getByText('Property')).toBeInTheDocument()
  expect(index.getByText('Financials')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('tab', { name: /Bank Statement/ }))
  // The index row drops the redundant suffix; the detail header keeps the full name.
  await waitFor(() => expect(screen.getByText('Bank Statement Analyzer')).toBeInTheDocument())
  expect(screen.getByRole('tab', { name: 'Bank Statement 77' })).toBeInTheDocument()
})

// Every analyzer in the baseline is assumed, so the section rollup has nothing
// measured to average. Reporting that as 0% beside a row reading 77 was the
// contradiction; the heading and the hero both have to say "not measured".
test('the Analyzers rollup reads as not measured when no board has counted', async () => {
  render(<App />)
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
  await userEvent.click(screen.getByRole('button', { name: 'Analyzers' }))
  await waitFor(() => expect(screen.getByText('Analyzer readiness')).toBeInTheDocument())

  const heading = screen.getByRole('tablist', { name: 'Analyzers' }).previousElementSibling!
  expect(heading.textContent).toContain('Not measured')
  expect(heading.textContent).not.toContain('0%')

  const hero = screen.getByText('Analyzer readiness').parentElement!
  expect(hero.textContent).toContain('Not measured')
  expect(hero.querySelector('[role="progressbar"]')).toBeNull()
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
  expect(rollup.textContent).toContain('All 1 analyzers measured')
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

test('a link straight to a module opens on it', async () => {
  window.location.hash = '#/analyzers/bank'
  render(<App />)
  await waitFor(() => expect(screen.getByText('Bank Statement Analyzer')).toBeInTheDocument())
  expect(screen.getByRole('tab', { name: /Bank Statement/ })).toHaveAttribute('aria-selected', 'true')
})

test('selecting a module puts it in the URL, so the view can be shared', async () => {
  render(<App />)
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
  await userEvent.click(screen.getByRole('tab', { name: /Underwriting/ }))
  await waitFor(() => expect(window.location.hash).toBe('#/delivery/uw'))
})

// A pasted link is untrusted: it must not leave the console pointing at nothing.
test('a link to a module that is not there falls back instead of rendering empty', async () => {
  window.location.hash = '#/analyzers/does-not-exist'
  render(<App />)
  await waitFor(() => expect(screen.getByText('Analyzer readiness')).toBeInTheDocument())
  expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
})

test('a link to a section that is not there falls back to the first one', async () => {
  window.location.hash = '#/nonsense/whatever'
  render(<App />)
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
})

test('the back button moves between modules', async () => {
  render(<App />)
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
  await userEvent.click(screen.getByRole('tab', { name: /Underwriting/ }))
  await waitFor(() => expect(screen.getByText('Analyzer framework.')).toBeInTheDocument())

  window.history.back()
  await waitFor(() => expect(window.location.hash).not.toBe('#/delivery/uw'))
  await waitFor(() => expect(screen.getAllByText('Pricing & Eligibility')).toHaveLength(2))
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
