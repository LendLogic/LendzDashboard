import type { Status } from '../../shared/readiness.js'
import {
  DEFAULT_STATUS_COLUMN,
  MODULE_REGISTRY,
  isActiveEntry,
  moduleEnvVar,
  moduleStatusColumn,
  type ModuleEntry,
  type ModuleKey,
} from '../../shared/registry.js'
import type { RawStory } from './monday.js'

export type { ModuleKey }

export { ANALYZER_KEYS } from '../../shared/readiness.js'

// Canonical module order, derived from the registry so live and baseline payloads
// can never drift in ordering.
export const MODULE_ORDER = MODULE_REGISTRY.map((e) => e.key) as readonly ModuleKey[]

const ENTRY_BY_KEY = new Map<string, ModuleEntry>(MODULE_REGISTRY.map((e) => [e.key, e]))

// The Broker LOS board is shared: these Lexi-scoped items feed the `lexi` module,
// the rest feed `broker`. Monday is not modified; routing lives here, keyed by item
// id. The board id itself comes from the registry, never a second literal — give
// lexi its own board and this partition stops applying on its own.
export const LEXI_BROKER_BOARD_ID: number | null = ENTRY_BY_KEY.get('broker')?.board ?? null
const LEXI_ITEM_IDS: ReadonlySet<string> = new Set([
  '12451013226', // Lexi Intelligence — extract into a microservice
  '12482521999', // Generative UI
  '12482526623', // Agent loop
  '12451140139', // Lexi AI assistant (advisory, wizard-first)
  '12451122951', // Lexi capability standard + tool roadmap
  '12451013290', // Lexi document upload (chat attachments)
  '12451008846', // AI — Anthropic Claude (.NET SDK)
])

export function filterStoriesForModule(
  key: ModuleKey,
  boardId: number,
  stories: RawStory[],
): RawStory[] {
  if (LEXI_BROKER_BOARD_ID === null || boardId !== LEXI_BROKER_BOARD_ID) return stories
  if (key === 'lexi') return stories.filter((s) => LEXI_ITEM_IDS.has(s.id))
  if (key === 'broker') return stories.filter((s) => !LEXI_ITEM_IDS.has(s.id))
  return stories
}

export function getModuleBoardId(key: ModuleKey): number | null {
  const entry = ENTRY_BY_KEY.get(key)
  if (!entry) return null
  const n = Number(process.env[moduleEnvVar(entry)])
  if (Number.isFinite(n) && n > 0) return n
  return entry.board ?? null
}

export function getModuleStatusColumnId(key: ModuleKey): string {
  const entry = ENTRY_BY_KEY.get(key)
  return entry ? moduleStatusColumn(entry) : DEFAULT_STATUS_COLUMN
}

// The modules that produce a live card: board wired and not hidden. Drives which
// boards the refresh fetches and which modules the payload carries, so a hidden
// module costs no Monday call and cannot reach any rollup.
export function activeModuleKeys(): ModuleKey[] {
  return MODULE_REGISTRY.filter((e) => isActiveEntry(e, getModuleBoardId(e.key))).map((e) => e.key)
}

export type Bucket = 'delivered' | 'inProgress' | 'remaining'

export const STATUS_BUCKET: Record<string, Bucket> = {
  Done: 'delivered',
  'In Progress': 'inProgress',
  'Working on it': 'inProgress',
  'Code Review': 'inProgress',
  QA: 'inProgress',
  'Ready to start': 'remaining',
  'Not Started': 'remaining',
  Stuck: 'remaining',
  '': 'remaining',
}

export function bucketForStatus(status: string | null | undefined): Bucket {
  return STATUS_BUCKET[status ?? ''] ?? 'remaining'
}

export function statusFromPercent(percent: number): Status {
  if (percent >= 65) return 'on_track'
  if (percent >= 40) return 'in_progress'
  return 'early'
}

export const STATUS_LABELS: Record<Status, string> = {
  on_track: 'On track',
  in_progress: 'In progress',
  early: 'Early build',
  at_risk: 'At risk',
  blocked: 'Blocked',
}

export function cleanTitle(name: string): string {
  return name
    .replace(/^S\d+\s*·\s*/, '')
    .replace(/^[A-Z]+-[\w-]+\s*·\s*/, '')
    .trim()
}

export const SUBITEM_STATUS_COLUMN_ID = 'status'

export function cleanSubtaskTitle(name: string): string {
  return name.replace(/^[A-Z0-9]+(?:-[A-Z0-9]+)+:\s*/, '').trim()
}

export function getMondayToken(): string {
  const t = process.env.MONDAY_API_TOKEN
  if (!t) throw new Error('MONDAY_API_TOKEN is not set')
  return t
}
