import type { Provenance } from '../lib/provenance'

export function PercentReadout({ percent, provenance }: {
  percent: number
  provenance: Provenance
}) {
  if (provenance === 'unmeasured') {
    return (
      <span className="bignum none">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not measured</span>
      </span>
    )
  }
  return (
    <span className={`bignum${provenance === 'asserted' ? ' asserted' : ''}`}>
      {percent}
      <span className="unit">%</span>
    </span>
  )
}
