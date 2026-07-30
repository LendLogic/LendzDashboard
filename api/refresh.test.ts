// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Request, Response } from 'express'

vi.mock('./_lib/refresh-core.js', () => ({ runRefresh: vi.fn() }))
vi.mock('./_lib/blob.js', () => ({ readLatest: vi.fn() }))

import handler, { REFRESH_COOLDOWN_SECONDS } from './refresh'
import { runRefresh } from './_lib/refresh-core.js'
import { readLatest } from './_lib/blob.js'

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    },
    setHeader(k: string, v: string) {
      this.headers[k] = v
    },
  }
  return res
}

const post = () => ({ method: 'POST', headers: {} }) as unknown as Request

function blobBuiltSecondsAgo(seconds: number) {
  return {
    asOf: 'x',
    modules: [],
    source: 'live' as const,
    builtAt: new Date(Date.now() - seconds * 1000).toISOString(),
  }
}

beforeEach(() => {
  vi.mocked(readLatest).mockResolvedValue(null)
  vi.mocked(runRefresh).mockResolvedValue({ modules: 11, builtAt: '2026-07-30T18:00:00.000Z' })
})
afterEach(() => vi.clearAllMocks())

test('refreshes and reports what it wrote', async () => {
  const res = mockRes()
  await handler(post(), res as unknown as Response)
  expect(runRefresh).toHaveBeenCalledTimes(1)
  expect(res.statusCode).toBe(200)
  expect(res.body).toEqual({ ok: true, modules: 11, builtAt: '2026-07-30T18:00:00.000Z' })
})

test('a blob younger than the cooldown is left alone, with the wait reported', async () => {
  vi.mocked(readLatest).mockResolvedValue(blobBuiltSecondsAgo(20))
  const res = mockRes()
  await handler(post(), res as unknown as Response)
  expect(runRefresh).not.toHaveBeenCalled()
  expect(res.statusCode).toBe(429)
  expect(res.body).toEqual({ error: 'cooldown', retryAfterSeconds: REFRESH_COOLDOWN_SECONDS - 20 })
  expect(res.headers['Retry-After']).toBe(String(REFRESH_COOLDOWN_SECONDS - 20))
})

test('a blob older than the cooldown refreshes', async () => {
  vi.mocked(readLatest).mockResolvedValue(blobBuiltSecondsAgo(REFRESH_COOLDOWN_SECONDS + 1))
  const res = mockRes()
  await handler(post(), res as unknown as Response)
  expect(runRefresh).toHaveBeenCalledTimes(1)
  expect(res.statusCode).toBe(200)
})

// A baseline blob carries no builtAt, so there is no age to compare against.
test('a blob with no builtAt does not gate the refresh', async () => {
  vi.mocked(readLatest).mockResolvedValue({ asOf: 'x', modules: [], source: 'baseline' as const })
  const res = mockRes()
  await handler(post(), res as unknown as Response)
  expect(runRefresh).toHaveBeenCalledTimes(1)
  expect(res.statusCode).toBe(200)
})

test('a second caller while one refresh is in flight is turned away, not queued', async () => {
  let release: () => void = () => {}
  vi.mocked(runRefresh).mockImplementation(
    () => new Promise((resolve) => { release = () => resolve({ modules: 11, builtAt: 'b' }) }),
  )
  const first = mockRes()
  const firstDone = handler(post(), first as unknown as Response)

  const second = mockRes()
  await handler(post(), second as unknown as Response)
  expect(second.statusCode).toBe(409)
  expect(second.body).toEqual({ error: 'refresh already running' })
  expect(runRefresh).toHaveBeenCalledTimes(1)

  release()
  await firstDone
  expect(first.statusCode).toBe(200)
})

test('the lock is released after a failure, so the next caller can retry', async () => {
  vi.mocked(runRefresh).mockRejectedValueOnce(new Error('all Monday board fetches failed'))
  const failed = mockRes()
  await handler(post(), failed as unknown as Response)
  expect(failed.statusCode).toBe(500)

  const retry = mockRes()
  await handler(post(), retry as unknown as Response)
  expect(retry.statusCode).toBe(200)
})

// The endpoint is public, so an internal message would publish env var and account
// names to anyone who clicks. The operator gets the real reason from the logs.
test('a total Monday failure reports an operational reason, not the internal one', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(runRefresh).mockRejectedValueOnce(new Error('all Monday board fetches failed'))
  const res = mockRes()
  await handler(post(), res as unknown as Response)
  expect(res.statusCode).toBe(500)
  expect(res.body).toEqual({ error: 'Monday data unavailable' })
  expect(String(spy.mock.calls[0]?.[0])).toContain('all Monday board fetches failed')
  spy.mockRestore()
})

test('any other failure is generic outward and detailed in the logs', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(runRefresh).mockRejectedValueOnce(new Error('MONDAY_API_TOKEN is not set'))
  const res = mockRes()
  await handler(post(), res as unknown as Response)
  expect(res.statusCode).toBe(500)
  expect(res.body).toEqual({ error: 'unexpected server error' })
  expect(JSON.stringify(res.body)).not.toContain('MONDAY_API_TOKEN')
  expect(String(spy.mock.calls[0]?.[0])).toContain('MONDAY_API_TOKEN is not set')
  spy.mockRestore()
})
