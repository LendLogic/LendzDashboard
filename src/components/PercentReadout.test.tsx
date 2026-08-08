import { render, screen } from '@testing-library/react'
import { PercentReadout } from './PercentReadout'

test('a measured figure reads as a number with its unit', () => {
  const { container } = render(<PercentReadout percent={71} provenance="measured" />)
  expect(screen.getByText('71')).toBeInTheDocument()
  expect(container.textContent).toBe('71%')
})

test('an asserted figure still reads as a number, marked as asserted', () => {
  const { container } = render(<PercentReadout percent={77} provenance="asserted" />)
  expect(container.textContent).toBe('77%')
  expect(container.querySelector('.bignum')).toHaveClass('asserted')
})

// 0% claims the work has not started. Unmeasured means nobody counted, which is
// a different statement and the one that is true for a module with no board.
test('an unmeasured figure reads as an em dash, never as zero', () => {
  const { container } = render(<PercentReadout percent={0} provenance="unmeasured" />)
  expect(container.querySelector('[aria-hidden="true"]')!.textContent).toBe('—')
  expect(container.textContent).not.toContain('0')
  expect(container.textContent).not.toContain('%')
})

test('the em dash is announced as not measured rather than read as punctuation', () => {
  render(<PercentReadout percent={0} provenance="unmeasured" />)
  expect(screen.getByText('Not measured')).toBeInTheDocument()
})
