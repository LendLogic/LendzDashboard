import { fetchBoardStories } from './monday.js'
import type { RawStory } from './monday.js'
import { assembleLivePayload } from './rollup.js'
import { writeLatest } from './blob.js'
import {
  activeModuleKeys,
  filterStoriesForModule,
  getModuleBoardId,
  getModuleStatusColumnId,
  getMondayToken,
  type ModuleKey,
} from './config.js'

export interface RefreshResult {
  modules: number
  builtAt: string
}

// Pulls every board-backed Monday board, assembles the payload, and writes the
// blob. Shared by the scheduled job and any manual trigger; no HTTP concerns here.
export async function runRefresh(): Promise<RefreshResult> {
  const token = getMondayToken()
  const keys = activeModuleKeys()
  const results = await Promise.all(
    keys.map((k) => {
      const boardId = getModuleBoardId(k)!
      return fetchBoardStories({ token, boardId, statusColumnId: getModuleStatusColumnId(k) })
        .then((stories) => ({ k, stories: stories as RawStory[] | null }))
        .catch((e: unknown) => {
          // Without this the module just goes quiet: the caller sees one summary error and
          // has no way to tell a revoked token from a renamed board.
          console.error(`refresh: ${k} board ${boardId} failed: ${e instanceof Error ? e.message : String(e)}`)
          return { k, stories: null as RawStory[] | null }
        })
    }),
  )
  // A single decommissioned/renamed board must not sink the whole refresh, but a
  // total failure (bad token / Monday down) must not clobber the last-good blob.
  if (results.every((r) => r.stories === null)) {
    throw new Error('all Monday board fetches failed')
  }
  const storiesByModule: Partial<Record<ModuleKey, RawStory[]>> = {}
  for (const r of results) {
    if (r.stories !== null) storiesByModule[r.k] = filterStoriesForModule(r.k, getModuleBoardId(r.k)!, r.stories)
  }
  const now = new Date().toISOString()
  const payload = assembleLivePayload(storiesByModule, now)
  await writeLatest(payload)
  return { modules: payload.modules.length, builtAt: now }
}
