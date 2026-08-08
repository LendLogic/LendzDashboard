import type { ReactElement } from 'react'

export interface RailItem {
  key: string
  label: string
}

// Drawn rather than set as text: the self-hosted Archivo subset carries Latin
// only, so a glyph like ◈ would silently fall back to a system face and break
// the rail's metrics.
const ICONS: Record<string, ReactElement> = {
  delivery: (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <rect x="2" y="3.5" width="14" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="2" y="7.75" width="9.5" height="2.5" rx="1.25" fill="currentColor" opacity=".7" />
      <rect x="2" y="12" width="5.5" height="2.5" rx="1.25" fill="currentColor" opacity=".45" />
    </svg>
  ),
  analyzers: (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path d="M4 2.6h6.4L14 6.2v9.2H4z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.4 9.2h5.2M6.4 11.9h3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
}

const FALLBACK_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)

export function Rail({ items, activeKey, onSelect }: {
  items: RailItem[]
  activeKey: string
  onSelect: (key: string) => void
}) {
  return (
    <nav className="rail" aria-label="Sections">
      <div className="rail-mark" aria-hidden="true">LL</div>
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          className={`rail-item${it.key === activeKey ? ' active' : ''}`}
          aria-current={it.key === activeKey ? 'page' : undefined}
          onClick={() => onSelect(it.key)}
        >
          {ICONS[it.key] ?? FALLBACK_ICON}
          <span className="rail-label">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}
