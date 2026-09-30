import { ArrowRight, ClipboardCheck, ShieldCheck } from 'lucide-react'

import {
  AreaTrend,
  Donut,
  SalesBars,
  SampleBadge,
  Sparkline,
} from '@/components/dashboard/charts'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useTenantData } from '@/components/dashboard/useTenantData'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isDemoTenant, sample } from '@/lib/sampleData'

const KPI_ORDER = [
  ['AI inclusion rate', 'aiInclusionRate'],
  ['Factual accuracy', 'factualAccuracy'],
  ['Critical mismatches', 'criticalMismatches'],
  ['Correction rate', 'correctionRate'],
  ['Time to resolution', 'timeToResolution'],
] as const

export function DashboardAnalytics() {
  const { slug, record, activity, error } = useTenantData()
  const demo = isDemoTenant(slug)
  const q = slug ? `?slug=${encodeURIComponent(slug)}` : ''

  if (!slug || error) {
    return (
      <DashboardLayout slug={slug}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{error ? "Couldn't load this business" : 'No business loaded'}</CardTitle>
            <CardDescription>{error ?? 'Start from the landing page first.'}</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    )
  }

  const realTrend = activity?.accuracyTrend.map((p) => p.accuracyScore) ?? []
  const byTool = activity ? Object.entries(activity.mcpRequestsByTool) : []

  return (
    <DashboardLayout
      slug={slug}
      businessName={record?.profile.name}
      logoUrl={record?.profile.logoUrl}
      pendingReview={activity?.reviewCounts.pending ?? 0}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy md:text-[28px]">Analytics</h1>
            <p className="text-sm text-secondary">
              How people and AI assistants use your information, and how accurate it stays.
            </p>
          </div>
        </header>

        {demo && (
          <section aria-labelledby="kpi-heading" className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 id="kpi-heading" className="text-lg font-bold text-navy">
                Key indicators
              </h2>
              <SampleBadge />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {KPI_ORDER.map(([label, key]) => (
                <Card key={key} className="flex flex-col gap-1 p-4">
                  <p className="text-xs font-semibold text-secondary">{label}</p>
                  <p className="text-2xl font-extrabold tabular-nums text-navy">
                    {sample.kpis[key].value}
                  </p>
                  <p className="text-xs text-secondary">{sample.kpis[key].helper}</p>
                  <p className="mt-1 text-[11px] font-semibold text-review">
                    {sample.kpis[key].target}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-navy">Visits and AI calls, last 30 days</h2>
              {demo ? <SampleBadge /> : null}
            </div>
            {demo ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold text-secondary">
                    Website visits (people)
                  </p>
                  <AreaTrend
                    values={sample.visits}
                    labels={sample.labels}
                    color="#F68835"
                    name="Website visits"
                    height={130}
                    ariaLabel="Sample data: website visits over 30 days"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-secondary">
                    MCP calls (AI assistants)
                  </p>
                  <AreaTrend
                    values={sample.mcpCalls}
                    labels={sample.labels}
                    color="#408EEC"
                    name="MCP calls"
                    height={130}
                    ariaLabel="Sample data: MCP calls over 30 days"
                  />
                </div>
              </div>
            ) : (
              <p className="py-8 text-sm text-secondary">
                Website visits are not tracked yet. Recorded MCP requests so far:{' '}
                <span className="font-bold text-navy">{activity?.mcpRequestCount ?? '...'}</span>.
              </p>
            )}
          </Card>

          <Card className="flex flex-col items-center gap-3 p-5">
            <div className="flex w-full items-center justify-between gap-2">
              <h2 className="text-base font-bold text-navy">Who is asking</h2>
              {demo ? <SampleBadge /> : null}
            </div>
            {demo ? (
              <>
                <Donut
                  segments={sample.trafficSplit}
                  ariaLabel="Sample data: share of website visits versus MCP calls"
                />
                <ul className="w-full text-sm">
                  {sample.trafficSplit.map((s) => (
                    <li key={s.label} className="flex items-center justify-between py-0.5">
                      <span className="inline-flex items-center gap-2 text-secondary">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        {s.label}
                      </span>
                      <span className="font-bold tabular-nums text-navy">
                        {s.value.toLocaleString('en-US')}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-secondary">No traffic split available yet.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-navy">Sales through OneBridge</h2>
              {demo ? <SampleBadge /> : null}
            </div>
            {demo ? (
              <SalesBars
                values={sample.salesDaily}
                labels={sample.labels}
                ariaLabel={`Sample data: daily sales totaling $${sample.totals.salesDollars} over 30 days`}
              />
            ) : (
              <p className="py-8 text-sm text-secondary">
                Sales are not measured in this prototype. A pilot would measure them with the
                business's own point-of-sale data.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-navy">What customers ask AI about</h2>
              {demo ? <SampleBadge /> : null}
            </div>
            {demo ? (
              <ul className="flex flex-col gap-3">
                {sample.topQuestions.map((row) => (
                  <li key={row.label} className="flex items-center gap-3 text-sm">
                    <span className="w-44 shrink-0 truncate text-navy">{row.label}</span>
                    <span className="h-2 flex-1 rounded-full bg-gray">
                      <span
                        className="block h-2 rounded-full bg-blue"
                        style={{ width: `${(row.count / sample.topQuestions[0].count) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 text-right tabular-nums text-secondary">{row.count}</span>
                  </li>
                ))}
              </ul>
            ) : byTool.length ? (
              <ul className="flex flex-col gap-2 text-sm">
                {byTool.map(([tool, n]) => (
                  <li key={tool} className="flex justify-between">
                    <span className="font-mono text-xs text-secondary">{tool}</span>
                    <span className="font-bold tabular-nums text-navy">{n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary">No MCP requests recorded yet.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-navy">
                <ShieldCheck size={18} aria-hidden="true" className="text-action-blue" />
                Accuracy over time
              </h2>
              {realTrend.length < 2 && demo ? <SampleBadge /> : null}
            </div>
            {realTrend.length >= 2 || demo ? (
              <>
                <Sparkline
                  values={realTrend.length >= 2 ? realTrend : sample.accuracyTrend}
                  color="#1D4ED8"
                  className="h-24"
                />
                <p className="text-xs text-secondary">
                  {realTrend.length >= 2
                    ? `${realTrend.length} controlled checks, latest ${Math.round(realTrend[realTrend.length - 1] * 100)}%.`
                    : 'Illustrative trend. The Test tab shows how an accuracy check works.'}
                </p>
              </>
            ) : (
              <p className="text-sm text-secondary">No checks yet. Open the Test tab to see how a check works.</p>
            )}
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <ClipboardCheck size={18} aria-hidden="true" className="text-action-blue" />
              Review queue
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ['Pending', activity?.reviewCounts.pending],
                  ['Approved', activity?.reviewCounts.approved],
                  ['Rejected', activity?.reviewCounts.rejected],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="rounded-[10px] bg-gray p-3">
                  <p className="text-2xl font-extrabold tabular-nums text-navy">{n ?? '...'}</p>
                  <p className="text-xs text-secondary">{label}</p>
                </div>
              ))}
            </div>
            <a
              href={`/dashboard/review${q}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-action-blue underline underline-offset-4"
            >
              Open review queue <ArrowRight size={14} aria-hidden="true" />
            </a>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
