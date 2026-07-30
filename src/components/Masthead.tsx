import type { ReactNode } from 'react'

export function Masthead({ asOf, action }: { asOf: string; action?: ReactNode }) {
  const when = new Date(asOf).toLocaleString()
  return (
    <div className="masthead">
      <div className="brand">
        LendLogic
        <span>Delivery Readiness Console</span>
      </div>
      <div className="asof">
        as of
        <b>{when}</b>
        {action}
      </div>
    </div>
  )
}
