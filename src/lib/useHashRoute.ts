import { useCallback, useEffect, useState } from 'react'
import type { Route } from './route'
import { formatHash, parseHash } from './route'

// The hash is the state. Assigning to location.hash fires hashchange, so the
// same listener that serves the back button also serves our own navigation and
// the two can never disagree.
export function useHashRoute(): { route: Route | null; navigate: (section: string, key: string) => void } {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((section: string, key: string) => {
    window.location.hash = formatHash(section, key)
  }, [])

  return { route: parseHash(hash), navigate }
}
