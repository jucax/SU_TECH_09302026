import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { VerifiedRecord } from '@lib/schemas'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'

export interface ActivitySummary {
  mcpRequestCount: number
  mcpRequestsByTool: Record<string, number>
  lastUpdatedAt: string
  updatesApplied: number
  updatesBySource: Record<string, number>
  reviewCounts: { pending: number; approved: number; rejected: number }
  monitorRunCount: number
  latestAccuracyScore: number | null
  latestMismatches: number | null
  accuracyTrend: Array<{ createdAt: string; accuracyScore: number }>
}

// Slug from ?slug= (remembered for the session), plus the tenant's record and
// activity for the simple read-only dashboard tabs. Failures stay local.
export function useTenantData() {
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('slug') ?? sessionStorage.getItem(LAST_TENANT_KEY)
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
    sessionStorage.setItem(LAST_TENANT_KEY, slug)
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
