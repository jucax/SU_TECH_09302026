import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Bot, FlaskConical, Globe, RefreshCw, X } from 'lucide-react'

import { AreaTrend, SampleBadge, Sparkline } from '@/components/dashboard/charts'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import {
  McpPreview,
  WebsitePreview,
  type UpdatePhase,
} from '@/components/dashboard/FrontDoorPreviews'
import {
  UPDATE_INPUT_ID,
  UpdateChat,
  type DemoScript,
  type UpdateOutcome,
} from '@/components/dashboard/UpdateChat'
import type { ActivitySummary } from '@/components/dashboard/useTenantData'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { reviewReason } from '@/lib/reviewReasons'
import { isDemoTenant, sample } from '@/lib/sampleData'
import { formatPriceCents, formatRelativeTime } from '@lib/format'
import type { ChangeSet, VerifiedRecord } from '@lib/schemas'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const sumRange = (a: number[], from: number, to: number) =>
  a.slice(from, to).reduce((x, y) => x + y, 0)

interface DemoStep {
  request: string
  summary: string
  preset: ChangeSet
  // The real AI parse is used only if it produced this exact change; otherwise
  // the preset is applied so the scripted demo cannot fail on stage.
  accept: (cs: ChangeSet) => boolean
}

// Two preloaded requests derived from the tenant's current first product.
// Step 1 is a small price change (routine, auto-syncs). Step 2 is a ~30% jump
// (over the 20% rule in lib/governance.ts), so it is held for review.
function buildDemoSteps(record: VerifiedRecord, stepIndex: number): DemoStep[] {
  const p = record.products[0]
  if (!p?.id) return []
  const id = p.id
  const cur = p.priceCents
  const routineTarget = cur === 5499 ? 4999 : 5499
  const steps: DemoStep[] = [
    {
      request: `Update ${p.name}: instead of selling it for ${formatPriceCents(cur, p.currency)}, sell it for ${formatPriceCents(routineTarget, p.currency)}.`,
      summary: `Set ${p.name} price to ${formatPriceCents(routineTarget, p.currency)}`,
      preset: { productsUpdate: [{ id, priceCents: routineTarget }] },
      accept: (cs) =>
        !!cs.productsUpdate?.some((u) => u.id === id && u.priceCents === routineTarget),
    },
  ]
  // Step 2 is built from the price step 1 will leave behind.
  const base = stepIndex >= 1 ? cur : routineTarget
  const bigTarget = Math.round((base * 1.3) / 100) * 100 - 1
  steps.push({
    request: `Update ${p.name}: raise the price to ${formatPriceCents(bigTarget, p.currency)}.`,
    summary: `Set ${p.name} price to ${formatPriceCents(bigTarget, p.currency)}`,
    preset: { productsUpdate: [{ id, priceCents: bigTarget }] },
    accept: (cs) => !!cs.productsUpdate?.some((u) => u.id === id && u.priceCents === bigTarget),
  })
  return steps
}

function SnapshotCard({
  activity,
  demo,
}: {
  activity: ActivitySummary | null
  demo: boolean
}) {
  const half = Math.floor(sample.salesDaily.length / 2)
  const prev = sumRange(sample.salesDaily, 0, half)
  const recent = sumRange(sample.salesDaily, half, sample.salesDaily.length)
  const delta = Math.round(((recent - prev) / prev) * 100)
  const accuracy =
    activity?.latestAccuracyScore != null
      ? `${Math.round(activity.latestAccuracyScore * 100)}%`
      : 'No checks yet'

  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-navy">
          {demo ? 'Sales through OneBridge' : 'Information accuracy'}
        </h3>
        {demo && <SampleBadge />}
      </header>

      {demo ? (
        <>
          <p className="text-3xl font-extrabold tabular-nums text-navy">
            ${sample.totals.salesDollars.toLocaleString('en-US')}
          </p>
          <p className="text-xs text-secondary">
            Last 30 days, {sample.totals.orders} orders.{' '}
            <span className="font-semibold text-success">+{delta}%</span> vs previous 15 days
          </p>
          <Sparkline values={sample.salesDaily} color="#166534" className="h-24 flex-1" />
        </>
      ) : (
        <>
          <p className="text-3xl font-extrabold tabular-nums text-navy">{accuracy}</p>
          <p className="text-xs text-secondary">
            Latest controlled accuracy check
            {activity ? ` (${activity.monitorRunCount} run${activity.monitorRunCount === 1 ? '' : 's'})` : ''}
          </p>
        </>
      )}

      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-secondary">Accuracy</dt>
          <dd className="font-bold text-navy">{demo ? sample.kpis.factualAccuracy.value : accuracy}</dd>
        </div>
        <div>
          <dt className="text-secondary">Fresh</dt>
          <dd className="font-bold text-navy">
            {activity ? formatRelativeTime(activity.lastUpdatedAt) : '...'}
          </dd>
        </div>
        <div>
          <dt className="text-secondary">In review</dt>
          <dd className="font-bold text-navy">{activity ? activity.reviewCounts.pending : '...'}</dd>
        </div>
      </dl>
    </Card>
  )
}

function Metric({
  icon,
  label,
  value,
  helper,
  sampleTag,
  children,
}: {
  icon: React.ReactNode
  label: string
  value: string
  helper: string
  sampleTag?: boolean
  children?: React.ReactNode
}) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
        {icon}
        {label}
        {sampleTag && <SampleBadge className="ml-auto" />}
      </div>
      <p className="text-3xl font-extrabold tabular-nums text-navy">{value}</p>
      <p className="text-xs text-secondary">{helper}</p>
      {children && <div className="mt-3">{children}</div>}
    </Card>
  )
}

function PerformanceSection({
  activity,
  failed,
  demo,
  onRetry,
}: {
  activity: ActivitySummary | null
  failed: boolean
  demo: boolean
  onRetry: () => void
}) {
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
          value={demo ? sample.totals.visits.toLocaleString('en-US') : 'Not tracked yet'}
          helper={demo ? 'Last 30 days' : 'Visit counting is not built in this prototype.'}
          sampleTag={demo}
        >
          {demo && (
            <AreaTrend
              values={sample.visits}
              labels={sample.labels}
              color="#F68835"
              name="Website visits"
              height={180}
              ariaLabel={`Sample data: ${sample.totals.visits} website visits over 30 days`}
            />
          )}
        </Metric>
        <Metric
          icon={<Bot size={18} aria-hidden="true" />}
          label="MCP calls (AI assistants)"
          value={
            demo
              ? sample.totals.mcpCalls.toLocaleString('en-US')
              : activity
                ? String(activity.mcpRequestCount)
                : failed
                  ? 'Not available'
                  : '...'
          }
          helper={
            demo
              ? `Last 30 days. Live recorded requests on this sandbox: ${activity?.mcpRequestCount ?? '...'}`
              : "Recorded tool requests to this business's MCP server, not unique users."
          }
          sampleTag={demo}
        >
          {demo && (
            <AreaTrend
              values={sample.mcpCalls}
              labels={sample.labels}
              color="#408EEC"
              name="MCP calls"
              height={180}
              ariaLabel={`Sample data: ${sample.totals.mcpCalls} MCP calls over 30 days`}
            />
          )}
        </Metric>
      </div>

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

  const [phase, setPhase] = useState<UpdatePhase>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [reviewNotice, setReviewNotice] = useState<{ label: string; text: string } | null>(null)

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

  const demo = isDemoTenant(slug)
  const steps = record && demo ? buildDemoSteps(record, stepIndex) : []
  const currentStep = steps[stepIndex] ?? null
  const demoScript: DemoScript | null = demo
    ? { request: currentStep?.request ?? null, step: stepIndex + 1, total: steps.length }
    : null

  function focusUpdateBox() {
    const el = document.getElementById(demo ? 'onebridge-apply' : UPDATE_INPUT_ID)
    el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    el?.focus()
  }

  // Same structure -> apply handshake as before. The phases only mark calls
  // that really happen, so the animation never runs ahead of the backend.
  // In the demo, the real AI parse is tried first and checked against the
  // scripted change; the preset is used only when the parse differs or fails.
  async function handleUpdate(instruction: string): Promise<UpdateOutcome> {
    if (!slug) return { status: 'error', message: 'No business loaded.' }
    const step = demo ? currentStep : null
    try {
      setPhase('understanding')
      let changeSet: ChangeSet | null = null
      let summary = ''
      try {
        const structureRes = await fetch('/api/structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, instruction }),
        })
        const structureBody = await structureRes.json()
        if (!structureRes.ok) throw new Error(structureBody.error ?? 'Could not understand that')
        changeSet = structureBody.changeSet as ChangeSet
        summary = structureBody.summary as string
      } catch (err) {
        if (!step) throw err
      }
      if (step && (!changeSet || !step.accept(changeSet))) {
        changeSet = step.preset
        summary = step.summary
      }
      if (!changeSet) throw new Error('Could not understand that')

      setPhase('applying')
      const applyRes = await fetch('/api/apply-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, changeSet, summary, instruction }),
      })
      const applyBody = await applyRes.json()
      if (!applyRes.ok) throw new Error(applyBody.error ?? 'Could not apply that change')

      if (step) setStepIndex((i) => i + 1)

      if (applyBody.routing === 'review') {
        // Held changes are not published, so neither preview moves.
        loadActivity(slug)
        setPhase('idle')
        const reason = reviewReason(applyBody.ruleTriggered)
        const text = `${reason.why} ${reason.action}`
        setReviewNotice({ label: `${reason.label}: ${summary}`, text })
        return { status: 'review', message: `Not published yet. ${text}` }
      }

      setPhase('refreshing')
      await loadRecord(slug)
      loadActivity(slug)
      setPhase('done')
      await wait(2200)
      setPhase('idle')
      return { status: 'applied', message: `Applied to website and MCP: ${summary}` }
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
              Go back to the landing page and click "See a live demo" to load Jorge's Auto Parts into a
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
    ? `Change ${product.name} from ${formatPriceCents(product.priceCents, product.currency)} to ${formatPriceCents(product.priceCents + 500, product.currency)}`
    : null

  return (
    <DashboardLayout
      slug={slug}
      businessName={record.profile.name}
      logoUrl={record.profile.logoUrl}
      pendingReview={activity?.reviewCounts.pending ?? 0}
    >
      <div className="flex flex-col gap-6">
        {reviewNotice && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-[10px] border border-review/30 bg-review-surface px-4 py-3 text-sm text-review"
          >
            <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold">{reviewNotice.label}</p>
              <p>{reviewNotice.text}</p>
              <a
                href={`/dashboard/review${q}`}
                className="mt-1 inline-block font-semibold underline underline-offset-4"
              >
                Go to review queue
              </a>
            </div>
            <button
              type="button"
              onClick={() => setReviewNotice(null)}
              aria-label="Dismiss notice"
              className="text-review hover:opacity-70"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {demo && (
          <div
            role="note"
            className="flex items-start gap-2 rounded-[10px] border border-border bg-white px-4 py-3 text-sm text-navy"
          >
            <FlaskConical size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-action-blue" />
            <p>
              <span className="font-bold">This is a demo.</span> Business data and edits are real
              and private to your session. Charts tagged "Sample data" are illustrative, not
              measured.
            </p>
          </div>
        )}

        <header className="flex items-center gap-3">
          {record.profile.logoUrl && (
            <img
              src={record.profile.logoUrl}
              alt={`${record.profile.name} logo`}
              className="h-11 w-11 shrink-0 rounded-[10px] border border-border bg-white object-contain p-1"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold leading-tight text-navy md:text-[28px]">
              {record.profile.name}
            </h1>
            <p className="text-sm text-secondary">
              One information foundation. Two connected front doors.
              {activity && ` Last updated ${formatRelativeTime(activity.lastUpdatedAt)}.`}
            </p>
          </div>
        </header>

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <SnapshotCard activity={activity} demo={demo} />
          <WebsitePreview
            product={product}
            businessName={record.profile.name}
            logoUrl={record.profile.logoUrl}
            slug={record.profile.slug}
            phase={phase}
            onEdit={focusUpdateBox}
          />
          <McpPreview
            product={product}
            businessName={record.profile.name}
            slug={record.profile.slug}
            phase={phase}
            onEdit={focusUpdateBox}
          />
        </div>

        <UpdateChat
          phase={phase}
          demo={demoScript}
          example={example}
          reviewHref={`/dashboard/review${q}`}
          onSubmit={handleUpdate}
        />

        <PerformanceSection
          activity={activity}
          failed={activityFailed}
          demo={demo}
          onRetry={() => loadActivity(slug)}
        />
      </div>
    </DashboardLayout>
  )
}
