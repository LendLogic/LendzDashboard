import type { Provenance } from '../lib/provenance'

// The width is the value, set on the first render. The grow-in is a CSS
// animation rather than a JS-driven width change, so the rendered bar never
// contradicts aria-valuenow — not in a background tab, in print, or in a capture.
export function ProgressBar({ percent, provenance = 'measured' }: {
  percent: number
  provenance?: Provenance
}) {
  return (
    <div className={`track${provenance === 'asserted' ? ' asserted' : ''}`}>
      <div
        className="fill"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
