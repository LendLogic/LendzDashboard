import type { Request, Response } from 'express'
import { runRefresh } from './_lib/refresh-core.js'
import { readLatest } from './_lib/blob.js'

export const REFRESH_COOLDOWN_SECONDS = 60

// The endpoint is public, like the rest of the console, so the guards below are
// what bound the cost of a click: at most one refresh in flight, and at most one
// per cooldown window. The blob's own age is the cross-replica ceiling; the lock
// only protects the replica it lives in.
let inFlight = false

// Public endpoint: an internal message would publish env var and storage account names
// to anyone who clicks. Operational causes get wording an operator can act on; the real
// message always goes to the container logs.
function publicError(raw: string): string {
  if (raw.includes('all Monday board fetches failed')) return 'Monday data unavailable'
  return 'unexpected server error'
}

function ageInSeconds(builtAt: string | undefined): number | null {
  if (!builtAt) return null
  const built = Date.parse(builtAt)
  if (Number.isNaN(built)) return null
  return (Date.now() - built) / 1000
}

export default async function handler(_req: Request, res: Response) {
  if (inFlight) {
    res.status(409).json({ error: 'refresh already running' })
    return
  }

  // Claimed synchronously with the check above: an await in between would let two
  // near-simultaneous callers both find the lock open and both start a refresh.
  inFlight = true
  try {
    const age = ageInSeconds((await readLatest())?.builtAt)
    if (age !== null && age < REFRESH_COOLDOWN_SECONDS) {
      const retryAfterSeconds = Math.ceil(REFRESH_COOLDOWN_SECONDS - age)
      res.setHeader('Retry-After', String(retryAfterSeconds))
      res.status(429).json({ error: 'cooldown', retryAfterSeconds })
      return
    }
    const { modules, builtAt } = await runRefresh()
    res.status(200).json({ ok: true, modules, builtAt })
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : String(e)
    console.error(`refresh: request failed: ${raw}`)
    res.status(500).json({ error: publicError(raw) })
  } finally {
    inFlight = false
  }
}
