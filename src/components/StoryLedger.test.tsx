import { render, screen } from '@testing-library/react'
import { StoryLedger } from './StoryLedger'
import type { BucketItem } from '../../shared/readiness'

const empty = { delivered: [] as BucketItem[], inProgress: [] as BucketItem[], remaining: [] as BucketItem[] }
const zero = { delivered: 0, inProgress: 0, remaining: 0 }

const buckets = {
  delivered: [{ title: 'Product catalog', detail: 'and field library.' }],
  inProgress: [{ title: 'Final price calculation.' }],
  remaining: [{ title: 'Series 2 rules.' }],
}
const counts = { delivered: 53, inProgress: 14, remaining: 8 }

test('one section per bucket, each carrying its own count', () => {
  render(<StoryLedger buckets={buckets} counts={counts} provenance="measured" />)
  for (const [title, n] of [['Delivered', '53'], ['In Progress', '14'], ['Remaining', '8']]) {
    const head = screen.getByText(title).parentElement!
    expect(head.textContent).toContain(n)
  }
  expect(screen.getByText('Product catalog')).toBeInTheDocument()
  expect(screen.getByText(/and field library/)).toBeInTheDocument()
})

test('the tracked total is the sum of the three counts', () => {
  render(<StoryLedger buckets={buckets} counts={counts} provenance="measured" />)
  expect(screen.getByText('75 tracked')).toBeInTheDocument()
})

// Half the modules have no board, so the empty ledger is the common view, not
// the edge case. Three empty headings would be worse than one sentence.
test('a module with no board says so instead of showing three empty sections', () => {
  render(<StoryLedger buckets={empty} counts={zero} provenance="unmeasured" />)
  expect(screen.getByText(/no board is reporting stories/i)).toBeInTheDocument()
  expect(screen.queryByText('Delivered')).not.toBeInTheDocument()
  expect(screen.queryByText('Remaining')).not.toBeInTheDocument()
})

test('a board that returned nothing reads differently from a module with no board', () => {
  render(<StoryLedger buckets={empty} counts={zero} provenance="measured" />)
  expect(screen.getByText(/board has no stories/i)).toBeInTheDocument()
  expect(screen.queryByText(/no board is reporting stories/i)).not.toBeInTheDocument()
})

// An asserted figure says nothing about the board: it is a hand-written number
// with no stories behind it. Claiming the board came back empty asserts a fact
// nobody checked.
test('an asserted figure with no stories does not claim anything about the board', () => {
  render(
    <StoryLedger
      buckets={empty}
      counts={zero}
      provenance="asserted"
    />,
  )
  expect(screen.getByText(/no stories itemised behind this figure/i)).toBeInTheDocument()
  expect(screen.queryByText(/board/i)).not.toBeInTheDocument()
})

test('a section with a count but no itemised stories shows the count alone', () => {
  render(
    <StoryLedger
      buckets={{ ...empty, delivered: [{ title: 'Only this one.' }] }}
      counts={{ delivered: 1, inProgress: 0, remaining: 9 }}
      provenance="measured"
    />,
  )
  expect(screen.getByText('Only this one.')).toBeInTheDocument()
  const remaining = screen.getByText('Remaining').parentElement!
  expect(remaining.textContent).toContain('9')
  // an empty section is still listed, because its count is real information
  expect(screen.queryByText('In Progress')).not.toBeInTheDocument()
})

test('renders the weight chip for any weight including 0, omits it when absent', () => {
  const { container } = render(
    <StoryLedger
      buckets={{ ...empty, inProgress: [
        { title: 'Reads correctly.', weight: 30 },
        { title: 'Cost at scale.', weight: 0 },
        { title: 'No weight here.' },
      ] }}
      counts={{ delivered: 0, inProgress: 3, remaining: 0 }}
      provenance="measured"
    />,
  )
  expect(screen.getByText('30%')).toBeInTheDocument()
  expect(screen.getByText('0%')).toBeInTheDocument()
  expect(container.querySelectorAll('.wt')).toHaveLength(2)
})

test('renders sub-tasks with a roll-up count when a story has them', () => {
  render(
    <StoryLedger
      buckets={{ ...empty, inProgress: [{ title: 'ID Analyzer', subtasks: [
        { title: 'Structured extraction', status: 'Done' },
        { title: 'Provenance linking', status: '' },
        { title: 'Discrepancy detection', status: 'Working on it' },
      ] }] }}
      counts={{ delivered: 0, inProgress: 1, remaining: 0 }}
      provenance="measured"
    />,
  )
  expect(screen.getByText('1/3 done')).toBeInTheDocument()
  expect(screen.getByText('Structured extraction')).toBeInTheDocument()
  expect(screen.getByLabelText('Done')).toBeInTheDocument()
  expect(screen.getByLabelText('No status')).toBeInTheDocument()
  expect(screen.getByLabelText('Working on it')).toBeInTheDocument()
})

test('renders no roll-up or sub-task list when a story has no sub-tasks', () => {
  const { container } = render(
    <StoryLedger
      buckets={{ ...empty, delivered: [{ title: 'Plain story' }] }}
      counts={{ delivered: 1, inProgress: 0, remaining: 0 }}
      provenance="measured"
    />,
  )
  expect(screen.queryByText(/done$/)).not.toBeInTheDocument()
  expect(container.querySelector('.subtasks')).toBeNull()
})
