import { afterEach, expect, test, vi } from 'vitest'
import { fetchReadiness, triggerRefresh } from './api'

afterEach(() => vi.unstubAllGlobals())

test('fetches and returns the parsed payload without an Authorization header', async () => {
  const payload = { asOf: 'x', modules: [] }
  const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) })
  vi.stubGlobal('fetch', fetchSpy)
  await expect(fetchReadiness()).resolves.toEqual(payload)
  expect(fetchSpy).toHaveBeenCalledWith(
    '/api/readiness',
    expect.not.objectContaining({ headers: expect.objectContaining({ Authorization: expect.anything() }) }),
  )
})

test('throws on a non-ok response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
  await expect(fetchReadiness()).rejects.toThrow(/500/)
})

function jsonRes(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }
}

test('triggerRefresh posts and reports what the refresh wrote', async () => {
  const fetchSpy = vi.fn().mockResolvedValue(jsonRes(200, { ok: true, modules: 11, builtAt: 'b' }))
  vi.stubGlobal('fetch', fetchSpy)
  await expect(triggerRefresh()).resolves.toEqual({ kind: 'ok', modules: 11, builtAt: 'b' })
  expect(fetchSpy).toHaveBeenCalledWith('/api/refresh', { method: 'POST' })
})

test('triggerRefresh turns a 429 into a cooldown with its wait', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(429, { error: 'cooldown', retryAfterSeconds: 40 })))
  await expect(triggerRefresh()).resolves.toEqual({ kind: 'cooldown', retryAfterSeconds: 40 })
})

test('triggerRefresh turns a 409 into running', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(409, { error: 'refresh already running' })))
  await expect(triggerRefresh()).resolves.toEqual({ kind: 'running' })
})

test('triggerRefresh surfaces a server error message, and never rejects', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(500, { error: 'all Monday board fetches failed' })))
  await expect(triggerRefresh()).resolves.toEqual({ kind: 'error', message: 'all Monday board fetches failed' })
})

test('triggerRefresh survives a network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  await expect(triggerRefresh()).resolves.toEqual({ kind: 'error', message: 'offline' })
})
