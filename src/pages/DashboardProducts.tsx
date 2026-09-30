import { Package, Tag, TrendingUp, TriangleAlert } from 'lucide-react'

import { SampleBadge } from '@/components/dashboard/charts'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useTenantData } from '@/components/dashboard/useTenantData'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isDemoTenant, sample } from '@/lib/sampleData'
import { formatPriceCents } from '@lib/format'

function Stat({
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

export function DashboardProducts() {
  const { slug, record, activity, error } = useTenantData()
  const demo = isDemoTenant(slug)

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

  const products = record?.products ?? []
  const active = products.filter((p) => p.available)
  const unavailable = products.length - active.length
  const prices = products.map((p) => p.priceCents)
  const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
  const missingCompat = products.filter((p) => !p.compatibility).length

  return (
    <DashboardLayout
      slug={slug}
      businessName={record?.profile.name}
      logoUrl={record?.profile.logoUrl}
      pendingReview={activity?.reviewCounts.pending ?? 0}
    >
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-navy md:text-[28px]">Products</h1>
          <p className="text-sm text-secondary">
            Everything published to your website and MCP server, from one approved record.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Package size={18} aria-hidden="true" />}
            label="Active products"
            value={record ? String(active.length) : '...'}
            helper={record ? `${products.length} published in total` : 'Loading'}
          />
          <Stat
            icon={<Tag size={18} aria-hidden="true" />}
            label="Average price"
            value={record && products.length ? formatPriceCents(avg) : '...'}
            helper="Across published products"
          />
          <Stat
            icon={<TriangleAlert size={18} aria-hidden="true" />}
            label="Unavailable"
            value={record ? String(unavailable) : '...'}
            helper="Shown as out of stock to people and AI"
          />
          <Stat
            icon={<TrendingUp size={18} aria-hidden="true" />}
            label="Missing fit info"
            value={record ? String(missingCompat) : '...'}
            helper="Compatibility not provided, shown as unknown"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active products</CardTitle>
            <CardDescription>What you sell, straight from the verified record.</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto px-6 pb-6">
            {products.length === 0 ? (
              <p className="text-sm text-secondary">
                {record ? 'No products published' : 'Loading...'}
              </p>
            ) : (
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs text-secondary">
                  <tr>
                    <th className="pb-2 font-semibold">Product</th>
                    <th className="pb-2 font-semibold">Fits</th>
                    <th className="pb-2 text-right font-semibold">Price</th>
                    <th className="pb-2 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => (
                    <tr key={p.name}>
                      <td className="py-3 font-semibold text-navy">{p.name}</td>
                      <td className="py-3 text-secondary">{p.compatibility ?? 'Not provided'}</td>
                      <td className="py-3 text-right tabular-nums text-navy">
                        {formatPriceCents(p.priceCents, p.currency)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={
                            p.available
                              ? 'rounded-full bg-success-surface px-2 py-0.5 text-xs font-semibold text-success'
                              : 'rounded-full bg-error-surface px-2 py-0.5 text-xs font-semibold text-error'
                          }
                        >
                          {p.available ? 'In stock' : 'Unavailable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {demo && (
          <Card className="p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-navy">What AI assistants ask about most</h2>
              <SampleBadge />
            </div>
            <ul className="flex flex-col gap-3">
              {sample.productInsights.map((row) => (
                <li key={row.name} className="flex items-center gap-3 text-sm">
                  <span className="w-44 shrink-0 truncate font-semibold text-navy">{row.name}</span>
                  <span className="h-2 flex-1 rounded-full bg-gray">
                    <span
                      className="block h-2 rounded-full bg-blue"
                      style={{ width: `${(row.asks / sample.productInsights[0].asks) * 100}%` }}
                    />
                  </span>
                  <span className="w-16 text-right tabular-nums text-secondary">{row.asks} asks</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
