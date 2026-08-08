import { Fragment } from 'react'
import type { Provenance } from '../lib/provenance'

export interface IndexRow {
  key: string
  name: string
  percent?: number
  provenance?: Provenance
}

export interface IndexGroup {
  // An unlabelled group renders its rows with no heading above them.
  label?: string
  rows: IndexRow[]
}

export function IndexColumn({ groups, activeKey, onSelect, heading, headingValue }: {
  groups: IndexGroup[]
  activeKey: string
  onSelect: (key: string) => void
  heading: string
  headingValue?: string
}) {
  return (
    <div className="index">
      <div className="index-heading">
        <span>{heading}</span>
        {headingValue ? <b>{headingValue}</b> : null}
      </div>
      <div className="index-list" role="tablist" aria-orientation="vertical" aria-label={heading}>
        {groups.map((group, i) => (
          <Fragment key={group.label ?? `group-${i}`}>
            {group.label ? (
              <div className="index-group">
                <span>{group.label}</span>
                <span>{group.rows.length}</span>
              </div>
            ) : null}
            {group.rows.map((row) => (
              <button
                key={row.key}
                type="button"
                role="tab"
                aria-selected={row.key === activeKey}
                className={`index-row${row.key === activeKey ? ' active' : ''}`}
                onClick={() => onSelect(row.key)}
              >
                <span className="index-name">{row.name}</span>
                {row.percent == null ? null : row.provenance === 'unmeasured' ? (
                  // No track either: an empty rail beside the dash still reads as a
                  // measurement that came back at zero.
                  <span className="index-pct none">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">Not measured</span>
                  </span>
                ) : (
                  <>
                    <span
                      className={`index-bar${row.provenance === 'asserted' ? ' asserted' : ''}`}
                      aria-hidden="true"
                    >
                      <i style={{ width: `${row.percent}%` }} />
                    </span>
                    <span className="index-pct">{row.percent}</span>
                  </>
                )}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
