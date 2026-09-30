import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bot, Globe, Package, RefreshCw } from 'lucide-react'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import {
  McpPreview,
  WebsitePreview,
  type EditTarget,
  type UpdatePhase,
} from '@/components/dashboard/FrontDoorPreviews'
import {
  UPDATE_INPUT_ID,
  UpdateChat,
  type UpdateOutcome,
} from '@/components/dashboard/UpdateChat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPriceCents, formatRelativeTime } from '@lib/format'
import type { ChangeSet, VerifiedRecord } from '@lib/schemas'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'

interface ActivitySummary {
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function ProductsCard({ record }: { record: VerifiedRecord }) {
  const active = record.products.filter((p) => p.available)
  return (
    <Card className="flex flex-col gap-3 p-5">
      <header className="flex items-center gap-2">
        <Package size={22} aria-hidden="true" className="text-action-blue" />
        <h3 className="text-base font-bold text-navy">Active products</h3>
      </header>
      <p className="text-3xl font-extrabold tabular-nums text-navy">
        {active.length}
        <span className="ml-2 text-sm font-medium text-secondary">
          of {record.products.length} published
        </span>
      </p>
      {record.products.length === 0 ? (
        <p className="text-sm text-secondary">No products published</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {record.products.slice(0, 5).map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate font-semibold text-navy">{p.name}</span>
              <span className="shrink-0 tabular-nums text-secondary">
                {formatPriceCents(p.priceCents, p.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Metric({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode
  label: string
  value: string
  helper: string
}) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
        {icon}
        {label}
      </div>
      <p className="text-3xl font-extrabold tabular-nums text-navy">{value}</p>
      <p className="text-xs text-secondary">{helper}</p>
    </Card>
  )
}

function PerformanceSection({
  activity,
  failed,
  onRetry,
}: {
  activity: ActivitySummary | null
  failed: boolean
  onRetry: () => void
}) {
  const byTool = activity ? Object.entries(activity.mcpRequestsByTool) : []
  const maxTool = Math.max(1, ...byTool.map(([, n]) => n))

  return (
    <section aria-labelledby="performance-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="performance-heading" className="text-lg font-bold text-navy">
          Performance
        </h2>
        {failed && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 text-sm font-semibold text-action-blue underline underline-offset-4"
          >
            <RefreshCw size={14} aria-hidden="true" /> Activity unavailable, retry
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Metric
          icon={<Globe size={18} aria-hidden="true" />}
          label="Website visits (people)"
          value="Not tracked yet"
          helper="Visit counting is not built in this prototype, so no number is shown."
        />
        <Metric
          icon={<Bot size={18} aria-hidden="true" />}
          label="MCP calls (AI assistants)"
          value={activity ? String(activity.mcpRequestCount) : failed ? 'Not available' : '...'}
          helper="Recorded tool requests to this business's MCP server, not unique users."
        />
      </div>

      {byTool.length > 0 && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-navy">MCP calls by tool</p>
          <ul className="flex flex-col gap-2">
            {byTool.map(([tool, n]) => (
              <li key={tool} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate font-mono text-xs text-secondary">
                  {tool}
                </span>
                <span className="h-2 flex-1 rounded-full bg-gray">
                  <span
                    className="block h-2 rounded-full bg-blue"
                    style={{ width: `${(n / maxTool) * 100}%` }}
                  />
                </span>
                <span className="w-8 text-right tabular-nums text-navy">{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}

export function Dashboard() {
  const [searchParams] = useSearchParams()
  const [slug, setSlug] = useState<string | null>(null)
  const [record, setRecord] = useState<VerifiedRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [activityFailed, setActivityFailed] = useState(false)

  const [target, setTarget] = useState<EditTarget>('website')
  const [phase, setPhase] = useState<UpdatePhase>('idle')

  useEffect(() => {
    const fromQuery = searchParams.get('slug')
    const resolved = fromQuery ?? sessionStorage.getItem(LAST_TENANT_KEY)
    if (fromQuery) sessionStorage.setItem(LAST_TENANT_KEY, fromQuery)
    setSlug(resolved)
  }, [searchParams])

  const loadRecord = useCallback((forSlug: string) => {
    return fetch(`/api/tenant-record?slug=${encodeURIComponent(forSlug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load')
        return res.json() as Promise<VerifiedRecord>
      })
      .then(setRecord)
  }, [])

  const loadActivity = useCallback((forSlug: string) => {
    setActivityFailed(false)
    return fetch(`/api/activity?slug=${encodeURIComponent(forSlug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('activity')
        return res.json() as Promise<ActivitySummary>
      })
      .then(setActivity)
      .catch(() => setActivityFailed(true))
  }, [])

  useEffect(() => {
    if (!slug) return
    setError(null)
    setRecord(null)
    loadRecord(slug).catch((err) => setError(err.message))
    loadActivity(slug)
  }, [slug, loadRecord, loadActivity])

  function focusUpdateBox(next: EditTarget) {
    setTarget(next)
    document.getElementById(UPDATE_INPUT_ID)?.focus()
  }

  // Same structure -> apply handshake as before. The phases only mark calls
  // that really happen, so the animation never runs ahead of the backend.
  async function handleUpdate(instruction: string): Promise<UpdateOutcome> {
    if (!slug) return { status: 'error', message: 'No business loaded.' }
    try {
      setPhase('understanding')
      const structureRes = await fetch('/api/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, instruction }),
      })
      const structureBody = await structureRes.json()
      if (!structureRes.ok) throw new Error(structureBody.error ?? 'Could not understand that')
      const { changeSet, summary } = structureBody as { changeSet: ChangeSet; summary: string }

      setPhase('applying')
      const applyRes = await fetch('/api/apply-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, changeSet, summary, instruction }),
      })
      const applyBody = await applyRes.json()
      if (!applyRes.ok) throw new Error(applyBody.error ?? 'Could not apply that change')

      if (applyBody.routing === 'review') {
        // Held changes are not published, so neither preview moves.
        loadActivity(slug)
        setPhase('idle')
        return {
          status: 'review',
          message: `Held for owner review (${applyBody.ruleTriggered}): ${summary}`,
        }
      }

      setPhase('refreshing')
      await loadRecord(slug)
      loadActivity(slug)
      setPhase('done')
      await wait(2200)
      setPhase('idle')
      return { status: 'applied', message: `Applied: ${summary}` }
    } catch (err) {
      setPhase('idle')
      return {
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      }
    }
  }

  const q = slug ? `?slug=${encodeURIComponent(slug)}` : ''

  if (!slug) {
    return (
      <DashboardLayout slug={null}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No business loaded</CardTitle>
            <CardDescription>
              Go back to the landing page and click "See it work" to load Jorge's Auto Parts into a
              private sandbox.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/" className="text-sm text-action-blue underline underline-offset-4">
              Back to landing
            </a>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout slug={slug}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Couldn't load this business</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/" className="text-sm text-action-blue underline underline-offset-4">
              Back to landing
            </a>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (!record) {
    return (
      <DashboardLayout slug={slug}>
        <div className="grid gap-4 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 rounded-card border border-border bg-white" />
          ))}
        </div>
      </DashboardLayout>
    )
  }

  const product = record.products[0]
  const example = product
    ? `Change ${product.name} from ${formatPriceCents(product.priceCents, product.currency)} to ${formatPriceCents(product.priceCents + 1000, product.currency)}`
    : null

  return (
    <DashboardLayout
      slug={slug}
      businessName={record.profile.name}
      pendingReview={activity?.reviewCounts.pending ?? 0}
    >
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold leading-tight text-navy md:text-[28px]">
            {record.profile.name}
          </h1>
          <p className="text-sm text-secondary">
            One information foundation. Two connected front doors.
            {activity && ` Last updated ${formatRelativeTime(activity.lastUpdatedAt)}.`}
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          <ProductsCard record={record} />
          <WebsitePreview
            product={product}
            businessName={record.profile.name}
            slug={record.profile.slug}
            phase={phase}
            selected={target}
            onEdit={focusUpdateBox}
          />
          <McpPreview
            product={product}
            businessName={record.profile.name}
            slug={record.profile.slug}
            phase={phase}
            selected={target}
            onEdit={focusUpdateBox}
          />
        </div>

        <UpdateChat
          target={target}
          onTargetChange={setTarget}
          phase={phase}
          example={example}
          reviewHref={`/dashboard/review${q}`}
          onSubmit={handleUpdate}
        />

        <PerformanceSection
          activity={activity}
          failed={activityFailed}
          onRetry={() => loadActivity(slug)}
        />
      </div>
    </DashboardLayout>
  )
}
