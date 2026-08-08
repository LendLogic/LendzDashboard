import type { Module } from '../../shared/readiness'
import { ProgressBar } from './ProgressBar'
import { PercentReadout } from './PercentReadout'
import { globalAnalyzerPercent, shortLabel } from '../lib/analyzers'
import { provenanceOf } from '../lib/provenance'
import { STATUS_PILL } from '../lib/statusPill'

export function AnalyzersOverview({ analyzers, onSelect }: {
  analyzers: Module[]
  onSelect: (key: string) => void
}) {
  const pct = globalAnalyzerPercent(analyzers)
  const measured = analyzers.filter((m) => !m.assumed).length
  return (
    <div className="panel active" role="tabpanel">
      <div className="card">
        <div className="label">Analyzer readiness</div>
        <div><span className="bignum">{pct}<span className="unit">%</span></span></div>
        <ProgressBar percent={pct} />
        <div className="note">
          Combined across {analyzers.length} analyzers.{' '}
          <b>{measured} of {analyzers.length} measured</b> from a board; the rest carry
          asserted figures or none at all.
        </div>
      </div>
      <div className="analyzer-grid">
        {analyzers.map((m) => {
          const provenance = provenanceOf(m)
          return (
            <button
              key={m.key}
              type="button"
              className={`analyzer-card${provenance === 'measured' ? '' : ' asserted'}`}
              onClick={() => onSelect(m.key)}
            >
              <div className="ac-name">{shortLabel(m.name)}</div>
              <div>
                <span className="ac-pct">
                  <PercentReadout percent={m.percent} provenance={provenance} />
                </span>
                <span className={`pill ${STATUS_PILL[m.status]}`}>{m.statusLabel}</span>
              </div>
              {provenance === 'unmeasured' ? null : (
                <ProgressBar percent={m.percent} provenance={provenance} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
