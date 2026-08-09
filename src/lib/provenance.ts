import type { Module } from '../../shared/readiness'

// Where a figure came from, which the console states rather than hides. Half the
// modules have no Monday board yet, so "we did not measure this" is the most
// common thing the dashboard has to say, and 0% is not how to say it.
export type Provenance = 'measured' | 'asserted' | 'unmeasured'

export function provenanceOf(m: Module): Provenance {
  if (!m.assumed) return 'measured'
  return m.percent > 0 ? 'asserted' : 'unmeasured'
}
