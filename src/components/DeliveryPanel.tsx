import type { DeliveryModule } from '../../shared/readiness'
import { ProgressBar } from './ProgressBar'
import { PercentReadout } from './PercentReadout'
import { StoryLedger } from './StoryLedger'
import { StageTally } from './StageTally'
import { AssumedBadge } from './AssumedBadge'
import { STATUS_PILL } from '../lib/statusPill'
import { provenanceOf } from '../lib/provenance'

export function DeliveryPanel({ module: m }: { module: DeliveryModule }) {
  const brief = m.brief
  const provenance = provenanceOf(m)
  const hasDates = brief && (brief.goNoGo || brief.goLive)
  return (
    <div className="panel active" role="tabpanel">
      <div className="modband">
        <div>
          <div className="mtitle">
            {m.name}
            {m.assumed && m.assumedLabel ? <> <AssumedBadge text={m.assumedLabel} /></> : null}
            {brief?.programStatus ? <> <span className={`pill ${STATUS_PILL[brief.programStatus]}`}>{brief.programStatusLabel}</span></> : null}
          </div>
          <div className="msub">{m.sub}</div>
          {brief?.statusLine ? <div className="statusline">{brief.statusLine}</div> : null}
        </div>
        {hasDates ? (
          <div className="release datestrip">
            {brief.goNoGo ? <div><span className="dlabel">Go / No-Go</span><b>{brief.goNoGo}</b></div> : null}
            {brief.goLive ? <div><span className="dlabel">Go Live</span><b>{brief.goLive}</b></div> : null}
          </div>
        ) : (
          <div className="release">
            Target
            <b className={m.dateConfidence === 'projected' ? 'est' : ''}>{m.targetDate}</b>
          </div>
        )}
      </div>
      {brief?.detail ? (
        <details className="detail cardetail">
          <summary>Phase 1 detail</summary>
          <div className="detailbody">
            <div className="dgroup">
              <div className="dgtitle">Phase 1 scope</div>
              <ul>{brief.detail.phaseScope.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="dgroup">
              <div className="dgtitle">Analyzer status</div>
              <ul>{brief.detail.analyzerStatus.map((a, i) => <li key={i}><b>{a.name}</b>: {a.note}</li>)}</ul>
            </div>
          </div>
        </details>
      ) : null}
      {/* The in-progress and remaining tallies used to be two big cards of their
          own. They now head their own ledger sections, where the stories they
          count actually are, instead of being stated twice. */}
      <div className="card hero">
        <div className="label">Delivery progress</div>
        <div>
          <PercentReadout percent={m.percent} provenance={provenance} />
          <span className={`pill ${STATUS_PILL[m.status]}`}>{m.statusLabel}</span>
        </div>
        {provenance === 'unmeasured' ? null : (
          <ProgressBar percent={m.percent} provenance={provenance} />
        )}
        <div className="note">{m.note}</div>
      </div>
      <StageTally counts={m.counts} />
      <StoryLedger buckets={m.buckets} counts={m.counts} provenance={provenance} />
    </div>
  )
}
