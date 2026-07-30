import type { ReadinessPayload } from '../shared/readiness'

export type RefreshOutcome =
  | { kind: 'ok'; modules: number; builtAt: string }
  | { kind: 'cooldown'; retryAfterSeconds: number }
  | { kind: 'running' }
  | { kind: 'error'; message: string }

// Never rejects: every failure is a state the button renders, so callers have no
// error path to forget.
export async function triggerRefresh(): Promise<RefreshOutcome> {
  try {
    const res = await fetch('/api/refresh', { method: 'POST' })
    const body = (await res.json()) as Partial<{
      modules: number
      builtAt: string
      retryAfterSeconds: number
      error: string
    }>
    if (res.ok) return { kind: 'ok', modules: body.modules ?? 0, builtAt: body.builtAt ?? '' }
    if (res.status === 429) return { kind: 'cooldown', retryAfterSeconds: body.retryAfterSeconds ?? 60 }
    if (res.status === 409) return { kind: 'running' }
    return { kind: 'error', message: body.error ?? `Refresh failed (${res.status})` }
  } catch (e: unknown) {
    return { kind: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

export async function fetchReadiness(signal?: AbortSignal): Promise<ReadinessPayload> {
  const res = await fetch('/api/readiness', { signal })
  if (!res.ok) {
    throw new Error(`Failed to load readiness data (${res.status})`)
  }
  return (await res.json()) as ReadinessPayload
}
