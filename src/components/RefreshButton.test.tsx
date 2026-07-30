import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { RefreshButton } from './RefreshButton'
import { triggerRefresh } from '../api'

vi.mock('../api', () => ({ triggerRefresh: vi.fn() }))

afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

const button = () => screen.getByRole('button')

test('refreshes on click and reports back so the caller can reload', async () => {
  let release: () => void = () => {}
  vi.mocked(triggerRefresh).mockImplementation(
    () => new Promise((resolve) => { release = () => resolve({ kind: 'ok', modules: 11, builtAt: 'b' }) }),
  )
  const onRefreshed = vi.fn()
  render(<RefreshButton onRefreshed={onRefreshed} />)

  expect(button()).toHaveTextContent('Run now')
  await userEvent.click(button())

  expect(button()).toHaveTextContent('Refreshing')
  expect(button()).toBeDisabled()
  expect(onRefreshed).not.toHaveBeenCalled()

  release()
  await waitFor(() => expect(onRefreshed).toHaveBeenCalledTimes(1))
  expect(button()).toHaveTextContent('Run now')
  expect(button()).toBeEnabled()
})

test('a cooldown disables the button and counts the wait down', async () => {
  vi.mocked(triggerRefresh).mockResolvedValue({ kind: 'cooldown', retryAfterSeconds: 3 })
  const onRefreshed = vi.fn()
  render(<RefreshButton onRefreshed={onRefreshed} />)

  await userEvent.click(button())
  await waitFor(() => expect(button()).toHaveTextContent('Wait 3s'))
  expect(button()).toBeDisabled()
  expect(onRefreshed).not.toHaveBeenCalled()

  await waitFor(() => expect(button()).toHaveTextContent('Wait 1s'), { timeout: 4000 })
  await waitFor(() => expect(button()).toHaveTextContent('Run now'), { timeout: 4000 })
  expect(button()).toBeEnabled()
})

test('a refresh already running elsewhere reads as a wait, not an error', async () => {
  vi.mocked(triggerRefresh).mockResolvedValue({ kind: 'running' })
  render(<RefreshButton onRefreshed={vi.fn()} />)
  await userEvent.click(button())
  await waitFor(() => expect(screen.getByText(/already running/i)).toBeInTheDocument())
  expect(button()).toBeEnabled()
})

test('a failure is shown and the button stays usable', async () => {
  vi.mocked(triggerRefresh).mockResolvedValue({ kind: 'error', message: 'all Monday board fetches failed' })
  const onRefreshed = vi.fn()
  render(<RefreshButton onRefreshed={onRefreshed} />)

  await userEvent.click(button())
  await waitFor(() => expect(screen.getByText(/Refresh failed/i)).toBeInTheDocument())
  expect(button()).toBeEnabled()
  expect(onRefreshed).not.toHaveBeenCalled()
})
