import { render, screen } from '@testing-library/react'
import { AssumedBadge } from './AssumedBadge'
import { ProgressBar } from './ProgressBar'
import { InfoTooltip } from './InfoTooltip'

test('AssumedBadge renders its text', () => {
  render(<AssumedBadge text="Architecture phase" />)
  expect(screen.getByText('Architecture phase')).toBeInTheDocument()
})

test('ProgressBar exposes the percent via aria', () => {
  render(<ProgressBar percent={71} />)
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '71')
})

// The bar used to start at 0 and reach its value inside requestAnimationFrame,
// so the rendered width contradicted aria-valuenow until a frame ran — and a
// frame does not run in a background tab, in print, or in a screenshot.
test('ProgressBar renders at its value on the first paint, not a frame later', () => {
  render(<ProgressBar percent={71} />)
  const bar = screen.getByRole('progressbar')
  expect(bar.style.width).toBe('71%')
  expect(bar).toHaveAttribute('aria-valuenow', '71')
})

test('InfoTooltip renders its tip content', () => {
  render(<InfoTooltip>Helpful note</InfoTooltip>)
  expect(screen.getByText('Helpful note')).toBeInTheDocument()
})
