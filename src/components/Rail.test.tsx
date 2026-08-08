import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Rail } from './Rail'

const items = [
  { key: 'delivery', label: 'Delivery' },
  { key: 'analyzers', label: 'Analyzers' },
]

test('renders one labelled button per section and reports clicks', async () => {
  const onSelect = vi.fn()
  render(<Rail items={items} activeKey="delivery" onSelect={onSelect} />)
  expect(screen.getByRole('button', { name: 'Delivery' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Analyzers' }))
  expect(onSelect).toHaveBeenCalledWith('analyzers')
})

// The rail changes context rather than selecting a panel, so it is navigation
// with aria-current, not a second tablist competing with the index.
test('marks the active section with aria-current inside a nav landmark', () => {
  render(<Rail items={items} activeKey="analyzers" onSelect={() => {}} />)
  expect(screen.getByRole('navigation')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Analyzers' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', { name: 'Delivery' })).not.toHaveAttribute('aria-current')
})

test('every icon is hidden from assistive tech, so the label is the only name', () => {
  const { container } = render(<Rail items={items} activeKey="delivery" onSelect={() => {}} />)
  const svgs = container.querySelectorAll('svg')
  expect(svgs).toHaveLength(items.length)
  for (const svg of svgs) expect(svg).toHaveAttribute('aria-hidden', 'true')
})
