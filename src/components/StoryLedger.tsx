import type { BucketItem, DeliveryModule } from '../../shared/readiness'
import type { Provenance } from '../lib/provenance'
import { subtaskStatus } from '../lib/subtaskStatus'

const SECTIONS = [
  { key: 'delivered', tone: 'green', title: 'Delivered' },
  { key: 'inProgress', tone: 'amber', title: 'In Progress' },
  { key: 'remaining', tone: 'grey', title: 'Remaining' },
] as const

function Story({ item }: { item: BucketItem }) {
  const subs = item.subtasks ?? []
  const done = subs.filter((s) => subtaskStatus(s.status).done).length
  return (
    <div className="ledger-row">
      <b>
        {item.title}
        {item.weight != null && <span className="wt">{item.weight}%</span>}
        {subs.length > 0 && <span className="subroll">{done}/{subs.length} done</span>}
      </b>
      {item.detail ? ` ${item.detail}` : ''}
      {subs.length > 0 && (
        <ul className="subtasks">
          {subs.map((s, i) => (
            <li className="subtask" key={i}>
              <span
                className={`sdot ${subtaskStatus(s.status).tone}`}
                role="img"
                aria-label={s.status ? s.status : 'No status'}
                title={s.status ? s.status : 'No status'}
              />
              {s.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function StoryLedger({ buckets, counts, provenance }: {
  buckets: DeliveryModule['buckets']
  counts: DeliveryModule['counts']
  provenance: Provenance
}) {
  const total = counts.delivered + counts.inProgress + counts.remaining

  // With no board on half the modules, the empty ledger is the ordinary view.
  // One sentence that says which kind of empty this is beats three bare headings.
  if (total === 0) {
    return (
      <div className="ledger empty">
        {provenance === 'unmeasured'
          ? 'Nothing counted yet: no board is reporting stories for this module.'
          : 'The board has no stories yet.'}
      </div>
    )
  }

  return (
    <div className="ledger">
      <div className="ledger-head">
        <span>Stories</span>
        <span>{total} tracked</span>
      </div>
      {SECTIONS.map(({ key, tone, title }) => {
        const count = counts[key]
        if (count === 0) return null
        return (
          <section className={`ledger-section ${tone}`} key={key}>
            <div className="ledger-group">
              <span className="ico" />
              <span className="ttl">{title}</span>
              <span className="n">{count}</span>
            </div>
            {buckets[key].map((item, i) => <Story item={item} key={i} />)}
          </section>
        )
      })}
    </div>
  )
}
