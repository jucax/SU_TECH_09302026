import { useEffect, useState } from 'react'

// Whether this deployment can run the live accuracy check (it needs a Claude
// API key on the server). null while loading.
export function useAiEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/monitor')
      .then((res) => (res.ok ? (res.json() as Promise<{ enabled: boolean }>) : { enabled: false }))
      .then((body) => setEnabled(body.enabled))
      .catch(() => setEnabled(false))
  }, [])

  return enabled
}
