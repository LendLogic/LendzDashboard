import { useEffect, useState } from 'react'
import { triggerRefresh } from '../api'

type State =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'cooldown'; seconds: number }
  | { kind: 'note'; message: string }

export function RefreshButton({ onRefreshed }: { onRefreshed: () => void }) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  useEffect(() => {
    if (state.kind !== 'cooldown') return
    const t = setTimeout(() => {
      setState(state.seconds > 1 ? { kind: 'cooldown', seconds: state.seconds - 1 } : { kind: 'idle' })
    }, 1000)
    return () => clearTimeout(t)
  }, [state])

  async function run() {
    setState({ kind: 'running' })
    const outcome = await triggerRefresh()
    switch (outcome.kind) {
      case 'ok':
        setState({ kind: 'idle' })
        onRefreshed()
        return
      case 'cooldown':
        setState({ kind: 'cooldown', seconds: outcome.retryAfterSeconds })
        return
      case 'running':
        setState({ kind: 'note', message: 'A refresh is already running' })
        return
      case 'error':
        setState({ kind: 'note', message: `Refresh failed: ${outcome.message}` })
    }
  }

  const busy = state.kind === 'running' || state.kind === 'cooldown'
  const label =
    state.kind === 'running' ? 'Refreshing…' : state.kind === 'cooldown' ? `Wait ${state.seconds}s` : '↻ Run now'

  return (
    <div className="refresh">
      {state.kind === 'note' ? <span className="refresh-note">{state.message}</span> : null}
      <button className="refresh-btn" onClick={run} disabled={busy}>
        {label}
      </button>
    </div>
  )
}
