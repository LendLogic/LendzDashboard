import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { ReadinessPayload } from '../shared/readiness'
import { MIN_VISIBLE_PERCENT, visibleModules } from '../shared/readiness'
import { fetchReadiness } from './api'
import { Masthead } from './components/Masthead'
import { RefreshButton } from './components/RefreshButton'
import { Rail } from './components/Rail'
import type { RailItem } from './components/Rail'
import { IndexColumn } from './components/IndexColumn'
import type { IndexGroup } from './components/IndexColumn'
import { DeliveryPanel } from './components/DeliveryPanel'
import { AnalyzersOverview } from './components/AnalyzersOverview'
import { NotMeasured } from './components/NotMeasured'
import { partitionModules, analyzerAggregate, groupByFamily, shortLabel } from './lib/analyzers'
import { provenanceOf } from './lib/provenance'
import { useHashRoute } from './lib/useHashRoute'

const DELIVERY = 'delivery'
const ANALYZERS = 'analyzers'
const OVERVIEW = 'overview'

export default function App() {
  const [payload, setPayload] = useState<ReadinessPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  // What is on screen lives in the URL rather than in component state, so a
  // module can be linked to and the back button works.
  const { route, navigate } = useHashRoute()

  const load = useCallback((signal?: AbortSignal) => {
    return fetchReadiness(signal)
      .then(setPayload)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load])

  if (error) {
    return <div className="wrap"><div className="card">Could not load the console: {error}</div></div>
  }
  if (!payload) {
    return <div className="wrap"><div className="card">Loading…</div></div>
  }

  const refresh = <RefreshButton onRefreshed={load} />
  const { delivery, analyzers } = partitionModules(visibleModules(payload.modules))

  if (!delivery.length && !analyzers.length) {
    return (
      <div className="wrap">
        <Masthead asOf={payload.asOf} action={refresh} />
        <div className="card">No modules are above {MIN_VISIBLE_PERCENT}% readiness yet.</div>
      </div>
    )
  }

  const railItems: RailItem[] = []
  if (delivery.length) railItems.push({ key: DELIVERY, label: 'Delivery' })
  if (analyzers.length) railItems.push({ key: ANALYZERS, label: 'Analyzers' })

  // A link can name a section the payload no longer fills, so the route is
  // checked against what is actually there rather than trusted.
  const available = new Set(railItems.map((it) => it.key))
  const active = route && available.has(route.section) ? route.section : railItems[0].key
  const requested = route?.section === active ? route.key : null

  const deliveryKey = delivery.some((m) => m.key === requested) ? requested : delivery[0]?.key
  const analyzerActive = analyzers.find((m) => m.key === requested)

  let groups: IndexGroup[]
  let heading: string
  let headingValue: ReactElement | string | undefined
  let indexActive: string
  let onSelect: (key: string) => void
  let detail: ReactElement | null

  if (active === ANALYZERS) {
    groups = [
      { rows: [{ key: OVERVIEW, name: 'Overview' }] },
      ...groupByFamily(analyzers).map((s) => ({
        label: s.label,
        rows: s.modules.map((m) => ({
          key: m.key,
          name: shortLabel(m.name),
          percent: m.percent,
          provenance: provenanceOf(m),
        })),
      })),
    ]
    heading = 'Analyzers'
    const agg = analyzerAggregate(analyzers)
    headingValue = agg.provenance === 'unmeasured' ? <NotMeasured /> : `${agg.percent}%`
    // An unknown analyzer in the link falls back to the section's overview
    // rather than leaving the index pointing at nothing.
    indexActive = analyzerActive?.key ?? OVERVIEW
    onSelect = (key) => navigate(ANALYZERS, key)
    detail = analyzerActive
      ? <DeliveryPanel module={analyzerActive} />
      : <AnalyzersOverview analyzers={analyzers} onSelect={(key) => navigate(ANALYZERS, key)} />
  } else {
    groups = [{
      rows: delivery.map((m) => ({
        key: m.key,
        name: m.name,
        percent: m.percent,
        provenance: provenanceOf(m),
      })),
    }]
    heading = 'Delivery'
    indexActive = deliveryKey ?? ''
    onSelect = (key) => navigate(DELIVERY, key)
    const module = delivery.find((m) => m.key === deliveryKey)
    detail = module ? <DeliveryPanel module={module} /> : null
  }

  return (
    <div className="shell">
      <Rail
        items={railItems}
        activeKey={active}
        onSelect={(key) => navigate(key, key === ANALYZERS ? OVERVIEW : delivery[0]?.key ?? '')}
      />
      <IndexColumn
        groups={groups}
        activeKey={indexActive}
        onSelect={onSelect}
        heading={heading}
        headingValue={headingValue}
      />
      <main className="canvas">
        <Masthead asOf={payload.asOf} action={refresh} />
        {detail}
      </main>
    </div>
  )
}
