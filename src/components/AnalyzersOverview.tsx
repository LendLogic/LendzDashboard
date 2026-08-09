import type { Module } from '../../shared/readiness'
import { ProgressBar } from './ProgressBar'
import { NotMeasured } from './NotMeasured'
import { analyzerAggregate, groupByFamily, shortLabel } from '../lib/analyzers'
import { provenanceOf } from '../lib/provenance'
import { STATUS_PILL } from '../lib/statusPill'

// The rest of the console groups analyzers by family; a grid of cards was a
// third way of showing the same set, and most cards carried nothing but a name.
export function AnalyzersOverview({ analyzers, onSelect }: {
  analyzers: Module[]
  onSelect: (key: string) => void
}) {
  const agg = analyzerAggregate(analyzers)
  const measured = analyzers.filter((m) => !m.assumed).length

  return (
    <div className="panel active" role="tabpanel">
      <div className="card hero">
        <div className="label">Analyzer readiness</div>
        <div>
          {agg.provenance === 'unmeasured'
            ? <span className="bignum none"><NotMeasured /></span>
            : <span className="bignum">{agg.percent}<span className="unit">%</span></span>}
        </div>
        {agg.provenance === 'unmeasured' ? null : <ProgressBar percent={agg.percent} />}
        <div className="note">
          {measured === analyzers.length
            ? <>All {analyzers.length} analyzers measured from a board.</>
            : <><b>{measured} of {analyzers.length} measured</b> from a board; the rest carry
              asserted figures or none at all.</>}
        </div>
      </div>

      <div className="ledger">
        {groupByFamily(analyzers).map((section) => (
          <section className="ledger-section" key={section.family}>
            <div className="ledger-group plain">
              <h3 className="ttl">{section.label}</h3>
              <span className="n">{section.modules.length}</span>
            </div>
            {section.modules.map((m) => {
              const provenance = provenanceOf(m)
              return (
                <button
                  key={m.key}
                  type="button"
                  className="ledger-row analyzer-row"
                  onClick={() => onSelect(m.key)}
                >
                  <span className="ar-name">{shortLabel(m.name)}</span>
                  <span className="ar-meter">
                    {provenance === 'unmeasured' ? null : (
                      <ProgressBar percent={m.percent} provenance={provenance} />
                    )}
                  </span>
                  <span className="ar-pct">
                    {provenance === 'unmeasured' ? <NotMeasured /> : m.percent}
                  </span>
                  <span className={`pill ${STATUS_PILL[m.status]}`}>{m.statusLabel}</span>
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}
