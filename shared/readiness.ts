import { MODULE_REGISTRY, toBaselineModule } from './registry.js'

export interface ReadinessPayload {
  asOf: string
  modules: Module[]
  source?: 'live' | 'baseline'
  builtAt?: string
}

export type Module = DeliveryModule
export type Status = 'on_track' | 'in_progress' | 'early' | 'at_risk' | 'blocked'
export type DateConfidence = 'committed' | 'projected'

export interface SubTask {
  title: string
  status: string
}

export interface CardDetail {
  phaseScope: string[]
  analyzerStatus: { name: string; note: string }[]
}

// Editorial (PM-authored) header content, independent of the live Monday rollup.
// Every field is optional so a card can carry just release dates without a
// hand-written program status or status line.
export interface CardBrief {
  programStatus?: Status
  programStatusLabel?: string
  statusLine?: string
  goNoGo?: string
  goLive?: string
  detail?: CardDetail
}

export interface BucketItem {
  title: string
  detail?: string
  weight?: number
  subtasks?: SubTask[]
}

export interface DeliveryModule {
  key: string
  name: string
  sub: string
  phase: 'delivery'
  percent: number
  status: Status
  statusLabel: string
  note: string
  targetDate: string
  dateConfidence: DateConfidence
  assumed: boolean
  assumedLabel?: string
  brief?: CardBrief
  counts: { delivered: number; inProgress: number; remaining: number }
  buckets: {
    delivered: BucketItem[]
    inProgress: BucketItem[]
    remaining: BucketItem[]
  }
}

// Weighted delivery progress: a Done story counts fully, an In Progress story
// counts half, Remaining zero. Single-sourced so the per-module and global
// rollups can never diverge on the weighting.
export const IN_PROGRESS_CREDIT = 0.5

export function creditedPercent(delivered: number, inProgress: number, total: number): number {
  if (total === 0) return 0
  return Math.round(((delivered + inProgress * IN_PROGRESS_CREDIT) / total) * 100)
}

// Barely-started work reads as noise on an executive console, so a module stays
// off the tabs, off the cards and out of every rollup until it clears this floor.
// Presentational only: the payload keeps carrying the module.
export const MIN_VISIBLE_PERCENT = 10

// An assumed percent is an editorial placeholder, not a measurement — a module
// with no authored baseline sits at 0 no matter how far along it really is, so the
// floor only judges modules whose figures came from their board.
export function visibleModules(modules: Module[]): Module[] {
  return modules.filter((m) => m.assumed || m.percent >= MIN_VISIBLE_PERCENT)
}

export function buildPayload(now: string): ReadinessPayload {
  return { asOf: now, modules: MODULES, source: 'baseline' }
}

export const MODULES: Module[] = MODULE_REGISTRY.map(toBaselineModule)

export const MODULE_KEYS: readonly string[] = MODULE_REGISTRY.map((e) => e.key)

export const ANALYZER_KEYS: readonly string[] = MODULE_REGISTRY.filter((e) => e.analyzer).map(
  (e) => e.key,
)

export const MODULES_BY_KEY: Record<string, Module> = Object.fromEntries(
  MODULES.map((m) => [m.key, m]),
)
