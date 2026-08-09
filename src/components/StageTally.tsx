import type { DeliveryModule } from '../../shared/readiness'

const STAGES = [
  { key: 'delivered', tone: 'green', title: 'Delivered' },
  { key: 'inProgress', tone: 'amber', title: 'In Progress' },
  { key: 'remaining', tone: 'grey', title: 'Remaining' },
] as const

export function StageTally({ counts }: { counts: DeliveryModule['counts'] }) {
  const total = counts.delivered + counts.inProgress + counts.remaining

  // The ledger below already says which kind of empty this is; three zeros here
  // would only repeat it in a shape that reads like data.
  if (total === 0) return null

  return (
    <dl className="tally">
      {STAGES.map(({ key, tone, title }) => (
        <div className={`tally-cell ${tone}`} key={key}>
          <dt className="tally-label"><span className="ico" />{title}</dt>
          <dd className="tally-n">{counts[key]}</dd>
        </div>
      ))}
    </dl>
  )
}
