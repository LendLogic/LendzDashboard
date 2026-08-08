import { render, screen } from '@testing-library/react'
import { NotMeasured } from './NotMeasured'

test('shows an em dash to the eye and a phrase to a screen reader', () => {
  const { container } = render(<NotMeasured />)
  expect(container.querySelector('[aria-hidden="true"]')!.textContent).toBe('—')
  expect(screen.getByText('Not measured')).toBeInTheDocument()
  expect(container.textContent).not.toContain('0')
})
