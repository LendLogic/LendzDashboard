import type { Provenance } from '../lib/provenance'
import { NotMeasured } from './NotMeasured'

export function PercentReadout({ percent, provenance }: {
  percent: number
  provenance: Provenance
}) {
  if (provenance === 'unmeasured') {
    return <span className="bignum none"><NotMeasured /></span>
  }
  return (
    <span className={`bignum${provenance === 'asserted' ? ' asserted' : ''}`}>
      {percent}
      <span className="unit">%</span>
    </span>
  )
}
