import { useCallback, useEffect, useState } from 'react'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { reviewReason } from '@/lib/reviewReasons'
import { useTenantSlug } from '@/lib/tenantSession'
import type { ReviewQueueItem } from '@lib/schemas'

export function ReviewQueue() {
  const slug = useTenantSlug()
  const [items, setItems] = useState<ReviewQueueItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [decidingId, setDecidingId] = useState<string | null>(null)

  const load = useCallback((forSlug: string) => {
    return fetch(`/api/review?slug=${encodeURIComponent(forSlug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load')
        return res.json() as Promise<{ items: ReviewQueueItem[] }>
      })
      .then((body) => setItems(body.items))
  }, [])

  useEffect(() => {
    if (!slug) return
    load(slug).catch((err) => setError(err.message))
  }, [slug, load])

  async function decide(id: string, decision: 'approve' | 'reject') {
    if (!slug) return
    setDecidingId(id)
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, reviewId: id, decision }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to record decision')
      await load(slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDecidingId(null)
    }
  }

  if (!slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No business loaded</CardTitle>
            <CardDescription>Go back to the landing page and click "See it work" first.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/" className="text-sm text-action-blue underline underline-offset-4">
              Back to landing
            </a>
          </CardContent>
        </Card>
      </main>
    )
  }

  const pending = items.filter((i) => i.status === 'pending')
  const decided = items.filter((i) => i.status !== 'pending')

  return (
    <DashboardLayout slug={slug}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-action-blue">Governance</p>
          <h1 className="text-3xl font-extrabold text-navy">
            Review changes {pending.length > 0 && <span className="text-review">({pending.length})</span>}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Some changes need your approval before publication. Routine updates sync automatically;
            new products and price changes over 20% land here first, and every decision is recorded
            below.
          </p>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Pending ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-secondary">Nothing waiting for review.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-lg border border-review/20 bg-review-surface p-4"
                  >
                    <div>
                      <p className="font-semibold text-navy">{item.summary}</p>
                      <p className="text-sm font-semibold text-review">
                        {reviewReason(item.ruleTriggered).label}
                      </p>
                      <p className="text-sm text-review">{reviewReason(item.ruleTriggered).why}</p>
                      {item.rawInstruction && (
                        <p className="mt-1 text-sm text-secondary">"{item.rawInstruction}"</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="action"
                        size="sm"
                        onClick={() => decide(item.id, 'approve')}
                        disabled={decidingId === item.id}
                      >
                        Approve change
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => decide(item.id, 'reject')}
                        disabled={decidingId === item.id}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit trail</CardTitle>
            <CardDescription>Every decision, who made it, and when.</CardDescription>
          </CardHeader>
          <CardContent>
            {decided.length === 0 ? (
              <p className="text-sm text-secondary">No decisions yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {decided.map((item) => (
                  <li key={item.id} className="py-3">
                    <p className="text-navy">{item.summary}</p>
                    <p className="text-sm text-secondary">
                      <span
                        className={`font-semibold ${item.status === 'approved' ? 'text-success' : 'text-error'}`}
                      >
                        {item.status}
                      </span>{' '}
                      by {item.decidedBy ?? 'Unknown'} &middot;{' '}
                      {item.decidedAt && new Date(item.decidedAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
