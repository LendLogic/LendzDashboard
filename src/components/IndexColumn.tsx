import { Fragment } from 'react'

export interface IndexRow {
  key: string
  name: string
  percent?: number
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
                {row.percent != null ? (
                  <>
                    <span className="index-bar" aria-hidden="true">
                      <i style={{ width: `${row.percent}%` }} />
                    </span>
                    <span className="index-pct">{row.percent}</span>
                  </>
                ) : null}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
