import { useCallback, useEffect, useState } from 'react'

import { useTenantSlug } from '@/lib/tenantSession'
import type { ActivitySummary, VerifiedRecord } from '@lib/schemas'

// The current business's record and activity for the simpler dashboard tabs.
// Failures stay local to the tab that hit them.
export function useTenantData() {
  const slug = useTenantSlug()
  const [record, setRecord] = useState<VerifiedRecord | null>(null)
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!slug) return
    fetch(`/api/tenant-record?slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? (res.json() as Promise<VerifiedRecord>) : null))
      .then((r) => r && setRecord(r))
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    if (!slug) return
    setError(null)
    fetch(`/api/tenant-record?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load')
        return res.json() as Promise<VerifiedRecord>
      })
      .then(setRecord)
      .catch((e) => setError(e.message))
    fetch(`/api/activity?slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? (res.json() as Promise<ActivitySummary>) : null))
      .then((a) => a && setActivity(a))
      .catch(() => {})
  }, [slug])

  return { slug, record, activity, error, reload }
}
