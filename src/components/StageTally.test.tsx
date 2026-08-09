import { render, screen } from '@testing-library/react'
import { StageTally } from './StageTally'

const cell = (title: string) => screen.getByText(title).closest('.tally-cell')!

test('one column per stage, each carrying its own count', () => {
  render(<StageTally counts={{ delivered: 53, inProgress: 14, remaining: 8 }} />)
  for (const [title, n] of [['Delivered', '53'], ['In Progress', '14'], ['Remaining', '8']]) {
    expect(cell(title).textContent).toContain(n)
  }
})

// The whole point of the row: the ledger drops a section whose count is zero,
// so without this a finished stage and an empty one look the same — absent.
test('a stage with no stories still gets its column, reading zero', () => {
  render(<StageTally counts={{ delivered: 0, inProgress: 4, remaining: 0 }} />)
  expect(cell('Delivered').textContent).toContain('0')
  expect(cell('Remaining').textContent).toContain('0')
  expect(cell('In Progress').textContent).toContain('4')
})

// Three zeros state nothing the empty ledger does not already say better.
test('a module with no stories at all renders no row', () => {
  const { container } = render(<StageTally counts={{ delivered: 0, inProgress: 0, remaining: 0 }} />)
  expect(container.querySelector('.tally')).toBeNull()
})

test('each column carries its stage tone, so the dots read as the ledger does', () => {
  const { container } = render(<StageTally counts={{ delivered: 1, inProgress: 1, remaining: 1 }} />)
  expect([...container.querySelectorAll('.tally-cell')].map((c) => c.className)).toEqual([
    'tally-cell green',
    'tally-cell amber',
    'tally-cell grey',
  ])
})

test('the label and the count are a term and its definition, not loose text', () => {
  const { container } = render(<StageTally counts={{ delivered: 2, inProgress: 0, remaining: 1 }} />)
  expect(container.querySelector('dl.tally')).not.toBeNull()
  expect(container.querySelectorAll('dt')).toHaveLength(3)
  expect(container.querySelectorAll('dd')).toHaveLength(3)
})
