import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { IndexColumn } from './IndexColumn'
import type { IndexGroup } from './IndexColumn'

const groups: IndexGroup[] = [
  { rows: [{ key: 'overview', name: 'Overview' }] },
  { label: 'Borrower', rows: [{ key: 'id', name: 'ID', percent: 30 }] },
  {
    label: 'Financials',
    rows: [
      { key: 'bank', name: 'Bank Statement', percent: 77 },
      { key: 'paystub', name: 'Paystub', percent: 42 },
    ],
  },
]

test('renders a tab per row and reports the selected key', async () => {
  const onSelect = vi.fn()
  render(<IndexColumn groups={groups} activeKey="bank" heading="Analyzers" onSelect={onSelect} />)
  expect(screen.getAllByRole('tab')).toHaveLength(4)
  await userEvent.click(screen.getByRole('tab', { name: /Paystub/ }))
  expect(onSelect).toHaveBeenCalledWith('paystub')
})

test('marks only the active row as selected', () => {
  render(<IndexColumn groups={groups} activeKey="bank" heading="Analyzers" onSelect={() => {}} />)
  expect(screen.getByRole('tab', { name: /Bank Statement/ })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: /Paystub/ })).toHaveAttribute('aria-selected', 'false')
})

test('shows a family heading with its count, and none for an unlabelled group', () => {
  render(<IndexColumn groups={groups} activeKey="bank" heading="Analyzers" onSelect={() => {}} />)
  const borrower = screen.getByText('Borrower').parentElement!
  expect(borrower.textContent).toContain('1')
  const financials = screen.getByText('Financials').parentElement!
  expect(financials.textContent).toContain('2')
  // the Overview row is in a group with no label, so it gets no heading
  expect(screen.getByRole('tab', { name: /Overview/ })).toBeInTheDocument()
})

test('the vertical orientation is announced, since the rows stack', () => {
  render(<IndexColumn groups={groups} activeKey="bank" heading="Analyzers" onSelect={() => {}} />)
  const list = screen.getByRole('tablist')
  expect(list).toHaveAttribute('aria-orientation', 'vertical')
  expect(list).toHaveAttribute('aria-label', 'Analyzers')
})

test('a row without a percent shows no number and no bar', () => {
  const { container } = render(
    <IndexColumn groups={[{ rows: [{ key: 'overview', name: 'Overview' }] }]} activeKey="overview" heading="Analyzers" onSelect={() => {}} />,
  )
  expect(container.querySelectorAll('.index-bar')).toHaveLength(0)
  expect(screen.getByRole('tab', { name: 'Overview' }).textContent).toBe('Overview')
})

test('an unmeasured row shows an em dash and no bar, never a zero', () => {
  const { container } = render(
    <IndexColumn
      groups={[{ rows: [{ key: 'pl', name: 'P&L', percent: 0, provenance: 'unmeasured' }] }]}
      activeKey="pl" heading="Analyzers" onSelect={() => {}}
    />,
  )
  expect(container.querySelectorAll('.index-bar')).toHaveLength(0)
  expect(screen.getByRole('tab', { name: /P&L/ }).textContent).toContain('—')
  expect(screen.getByRole('tab', { name: /P&L/ }).textContent).not.toContain('0')
})

test('an asserted row keeps its figure but marks the bar as asserted', () => {
  const { container } = render(
    <IndexColumn
      groups={[{ rows: [{ key: 'bank', name: 'Bank Statement', percent: 77, provenance: 'asserted' }] }]}
      activeKey="bank" heading="Analyzers" onSelect={() => {}}
    />,
  )
  expect(container.querySelector('.index-bar')).toHaveClass('asserted')
  expect(screen.getByText('77')).toBeInTheDocument()
})

test('a measured row carries no asserted marking', () => {
  const { container } = render(
    <IndexColumn
      groups={[{ rows: [{ key: 'pe', name: 'Pricing', percent: 71, provenance: 'measured' }] }]}
      activeKey="pe" heading="Delivery" onSelect={() => {}}
    />,
  )
  expect(container.querySelector('.index-bar')).not.toHaveClass('asserted')
})

test('the heading carries an optional aggregate value', () => {
  render(<IndexColumn groups={groups} activeKey="bank" heading="Analyzers" headingValue="36%" onSelect={() => {}} />)
  expect(screen.getByText('Analyzers')).toBeInTheDocument()
  expect(screen.getByText('36%')).toBeInTheDocument()
})
