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
import { partitionModules, globalAnalyzerPercent, groupByFamily, shortLabel } from './lib/analyzers'

const DELIVERY = 'delivery'
const ANALYZERS = 'analyzers'
const OVERVIEW = 'overview'

export default function App() {
  const [payload, setPayload] = useState<ReadinessPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [section, setSection] = useState<string | null>(null)
  const [activeDelivery, setActiveDelivery] = useState<string | null>(null)
  const [activeAnalyzer, setActiveAnalyzer] = useState<string>(OVERVIEW)

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

  // A section the payload no longer fills must not stay selected, or the index
  // renders empty next to a detail panel with nothing in it.
  const available = new Set(railItems.map((it) => it.key))
  const active = section && available.has(section) ? section : railItems[0].key

  const deliveryKey = activeDelivery && delivery.some((m) => m.key === activeDelivery)
    ? activeDelivery
    : delivery[0]?.key
  const analyzerActive = analyzers.find((m) => m.key === activeAnalyzer)

  let groups: IndexGroup[]
  let heading: string
  let headingValue: string | undefined
  let indexActive: string
  let onSelect: (key: string) => void
  let detail: ReactElement | null

  if (active === ANALYZERS) {
    groups = [
      { rows: [{ key: OVERVIEW, name: 'Overview' }] },
      ...groupByFamily(analyzers).map((s) => ({
        label: s.label,
        rows: s.modules.map((m) => ({ key: m.key, name: shortLabel(m.name), percent: m.percent })),
      })),
    ]
    heading = 'Analyzers'
    headingValue = `${globalAnalyzerPercent(analyzers)}%`
    indexActive = activeAnalyzer
    onSelect = setActiveAnalyzer
    detail = analyzerActive
      ? <DeliveryPanel module={analyzerActive} />
      : <AnalyzersOverview analyzers={analyzers} onSelect={setActiveAnalyzer} />
  } else {
    groups = [{ rows: delivery.map((m) => ({ key: m.key, name: m.name, percent: m.percent })) }]
    heading = 'Delivery'
    indexActive = deliveryKey ?? ''
    onSelect = setActiveDelivery
    const module = delivery.find((m) => m.key === deliveryKey)
    detail = module ? <DeliveryPanel module={module} /> : null
  }

  return (
    <div className="shell">
      <Rail items={railItems} activeKey={active} onSelect={setSection} />
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
