import type { Module } from '../../shared/readiness'
import { ANALYZER_KEYS, creditedPercent } from '../../shared/readiness'
import type { AnalyzerFamily } from '../../shared/registry'
import type { Provenance } from './provenance'
import { ANALYZER_FAMILIES, FAMILY_LABEL, analyzerFamily } from '../../shared/registry'

// Every analyzer is named "<something> Analyzer", and the index already sits
// under an Analyzers heading. Repeating the word on all sixteen rows is what
// made the column wide enough to crowd the detail panel.
export function shortLabel(name: string): string {
  const trimmed = name.replace(/\s+Analyzer$/, '')
  return trimmed === '' ? name : trimmed
}

export interface FamilySection {
  family: AnalyzerFamily
  label: string
  modules: Module[]
}

// Empty families are dropped rather than rendered as bare headings: most of them
// sit empty until the remaining analyzers get boards.
export function groupByFamily(analyzers: Module[]): FamilySection[] {
  return ANALYZER_FAMILIES.map((family) => ({
    family,
    label: FAMILY_LABEL[family],
    modules: analyzers.filter((m) => analyzerFamily(m.key) === family),
  })).filter((section) => section.modules.length > 0)
}

export function partitionModules(modules: Module[]): { delivery: Module[]; analyzers: Module[] } {
  const analyzerSet = new Set<string>(ANALYZER_KEYS)
  const delivery = modules.filter((m) => !analyzerSet.has(m.key))
  const analyzers = ANALYZER_KEYS
    .map((k) => modules.find((m) => m.key === k))
    .filter((m): m is Module => m != null)
  return { delivery, analyzers }
}

// The rollup over every analyzer, carrying the same provenance the rows carry:
// an aggregate over nothing measured is not 0%, it is unmeasured.
export function analyzerAggregate(analyzers: Module[]): { percent: number; provenance: Provenance } {
  if (!analyzers.some((m) => !m.assumed)) return { percent: 0, provenance: 'unmeasured' }
  return { percent: globalAnalyzerPercent(analyzers), provenance: 'measured' }
}

export function globalAnalyzerPercent(analyzers: Module[]): number {
  let delivered = 0
  let inProgress = 0
  let total = 0
  for (const m of analyzers) {
    if (m.assumed) continue
    delivered += m.counts.delivered
    inProgress += m.counts.inProgress
    total += m.counts.delivered + m.counts.inProgress + m.counts.remaining
  }
  return creditedPercent(delivered, inProgress, total)
}
