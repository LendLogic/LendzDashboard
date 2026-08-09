import { render, screen } from '@testing-library/react'
import { DeliveryPanel } from './DeliveryPanel'
import type { DeliveryModule } from '../../shared/readiness'

const m: DeliveryModule = {
  key: 'pe', name: 'Pricing & Eligibility', sub: 'Pricing engine.', phase: 'delivery',
  percent: 71, status: 'on_track', statusLabel: 'On track', note: '53 of 75 accepted.',
  targetDate: '11 July', dateConfidence: 'committed', assumed: false,
  counts: { delivered: 53, inProgress: 14, remaining: 8 },
  buckets: {
    delivered: [{ title: 'Product catalog' }],
    inProgress: [{ title: 'Final price calc' }],
    remaining: [{ title: 'Series 2 rules' }],
  },
}

test('renders module name, percent, and one ledger section per bucket', () => {
  render(<DeliveryPanel module={m} />)
  expect(screen.getByText('Pricing & Eligibility')).toBeInTheDocument()
  expect(screen.getByText('71')).toBeInTheDocument()
  // Each stage is stated twice on purpose: the tally row summarises all three,
  // including any at zero, and the ledger head repeats the count over the
  // stories it actually counts.
  for (const [title, n] of [['Delivered', '53'], ['In Progress', '14'], ['Remaining', '8']]) {
    const [tally, ledger] = screen.getAllByText(title)
    expect(tally.closest('.tally-cell')!.textContent).toContain(n)
    expect(ledger.parentElement!.textContent).toContain(n)
  }
})

test('the tally row sits between the progress card and the ledger', () => {
  const { container } = render(<DeliveryPanel module={m} />)
  const blocks = [...container.querySelectorAll('.card.hero, .tally, .ledger')]
  expect(blocks.map((b) => b.className)).toEqual(['card hero', 'tally', 'ledger'])
})

test('without a brief, shows the Target date block and no status line', () => {
  render(<DeliveryPanel module={m} />)
  expect(screen.getByText('Target')).toBeInTheDocument()
  expect(screen.getByText('11 July')).toBeInTheDocument()
  expect(screen.queryByText('Go / No-Go')).not.toBeInTheDocument()
})

const withBrief: DeliveryModule = {
  ...m,
  brief: {
    programStatus: 'on_track',
    programStatusLabel: 'On Track',
    statusLine: 'Engine complete. Minor fixes only.',
    goNoGo: 'Jul 20',
    goLive: 'Aug 1',
  },
}

test('with a brief, renders the editorial pill, status line, and date strip (not Target)', () => {
  render(<DeliveryPanel module={withBrief} />)
  expect(screen.getByText('On Track')).toBeInTheDocument()
  expect(screen.getByText('Engine complete. Minor fixes only.')).toBeInTheDocument()
  expect(screen.getByText('Go / No-Go')).toBeInTheDocument()
  expect(screen.getByText('Jul 20')).toBeInTheDocument()
  expect(screen.getByText('Go Live')).toBeInTheDocument()
  expect(screen.getByText('Aug 1')).toBeInTheDocument()
  expect(screen.queryByText('Target')).not.toBeInTheDocument()
  // the live computed pill still renders alongside the editorial one
  expect(screen.getByText('On track')).toBeInTheDocument()
})

const datesOnlyBrief: DeliveryModule = {
  ...m,
  brief: { goNoGo: 'Jul 27', goLive: 'Aug 1' },
}

test('a dates-only brief shows the date strip without an editorial pill or status line', () => {
  render(<DeliveryPanel module={datesOnlyBrief} />)
  expect(screen.getByText('Go / No-Go')).toBeInTheDocument()
  expect(screen.getByText('Jul 27')).toBeInTheDocument()
  expect(screen.getByText('Go Live')).toBeInTheDocument()
  expect(screen.queryByText('Target')).not.toBeInTheDocument()
  // no hand-written status line for a dates-only brief
  expect(screen.queryByText('Engine complete. Minor fixes only.')).not.toBeInTheDocument()
  // the computed status pill still renders in the progress card
  expect(screen.getByText('On track')).toBeInTheDocument()
})

const withDetail: DeliveryModule = {
  ...m,
  brief: {
    ...withBrief.brief!,
    goLive: 'Aug 1 (Phase 1)',
    detail: {
      phaseScope: ['Document Upload and Versioning'],
      analyzerStatus: [{ name: 'Bank Statement', note: 'extraction delivered' }],
    },
  },
}

const unmeasured: DeliveryModule = {
  ...m, percent: 0, assumed: true, assumedLabel: 'Awaiting board data',
  counts: { delivered: 0, inProgress: 0, remaining: 0 },
}

test('a module with no board reads as not measured, not as zero percent', () => {
  const { container } = render(<DeliveryPanel module={unmeasured} />)
  expect(container.querySelector('.bignum')!.textContent).toContain('—')
  expect(container.querySelector('.bignum')!.textContent).not.toContain('0%')
  expect(screen.getByText('Awaiting board data')).toBeInTheDocument()
  // no meter at all: an empty track next to an em dash still implies a measurement
  expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0)
  // and no tally either: three zeros would read as counted, not as uncounted
  expect(container.querySelector('.tally')).toBeNull()
})

const asserted: DeliveryModule = { ...m, percent: 77, assumed: true, assumedLabel: 'Figures asserted' }

test('an asserted module keeps its meter but marks the track as asserted', () => {
  const { container } = render(<DeliveryPanel module={asserted} />)
  expect(container.querySelector('.track')).toHaveClass('asserted')
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '77')
})

test('a measured module carries no asserted marking on its track', () => {
  const { container } = render(<DeliveryPanel module={m} />)
  expect(container.querySelector('.track')).not.toHaveClass('asserted')
})

// Blobs written before the accent colours were retired still carry the field.
// Nothing may read it back, or an old refresh would repaint the new palette.
test('a stale accent colour in the payload never reaches the DOM', () => {
  const legacy = { ...m, accentColor: '#123456' } as DeliveryModule
  const { container } = render(<DeliveryPanel module={legacy} />)
  expect(container.querySelector('.modband')!.getAttribute('style')).toBeNull()
  expect(screen.getByRole('progressbar').style.background).toBe('')
})

test('with a detail, renders the expandable scope and analyzer status', () => {
  render(<DeliveryPanel module={withDetail} />)
  expect(screen.getByText('Phase 1 scope')).toBeInTheDocument()
  expect(screen.getByText('Document Upload and Versioning')).toBeInTheDocument()
  expect(screen.getByText('Analyzer status')).toBeInTheDocument()
  expect(screen.getByText('Bank Statement')).toBeInTheDocument()
  expect(screen.getByText(/extraction delivered/)).toBeInTheDocument()
})
