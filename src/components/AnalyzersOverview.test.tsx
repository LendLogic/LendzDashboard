import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AnalyzersOverview } from './AnalyzersOverview'
import type { Module } from '../../shared/readiness'

const analyzers = [
  { key: 'bank', name: 'Bank Statement Analyzer', percent: 67, status: 'on_track', statusLabel: 'On track', accentColor: '#123456', counts: { delivered: 2, inProgress: 0, remaining: 1 } },
  { key: 'id', name: 'ID Analyzer', percent: 0, status: 'early', statusLabel: 'Early build', counts: { delivered: 0, inProgress: 1, remaining: 2 } },
] as unknown as Module[]

test('shows the story-weighted global percent and a card per analyzer', () => {
  render(<AnalyzersOverview analyzers={analyzers} onSelect={() => {}} />)
  expect(screen.getByText('Analyzer readiness')).toBeInTheDocument()
  expect(screen.getByText('42')).toBeInTheDocument() // (2 + 0.5·1) / 6
  // cards drop the suffix the section heading already carries, like the index
  expect(screen.getByText('Bank Statement')).toBeInTheDocument()
  expect(screen.getByText('ID')).toBeInTheDocument()
})

test('a stale accent colour never reaches the DOM', () => {
  const { container } = render(<AnalyzersOverview analyzers={analyzers} onSelect={() => {}} />)
  for (const card of container.querySelectorAll('.analyzer-card')) {
    expect(card.getAttribute('style')).toBeNull()
  }
  for (const bar of screen.getAllByRole('progressbar')) {
    expect(bar.style.background).toBe('')
  }
})

test('clicking a card selects that analyzer', async () => {
  const onSelect = vi.fn()
  render(<AnalyzersOverview analyzers={analyzers} onSelect={onSelect} />)
  await userEvent.click(screen.getByText('ID'))
  expect(onSelect).toHaveBeenCalledWith('id')
})
