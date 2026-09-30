import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDayOfWeek, formatHoursEntry, formatPriceCents } from '@lib/format'
import type { VerifiedRecord } from '@lib/schemas'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'

export function Dashboard() {
  const [searchParams] = useSearchParams()
  const [slug, setSlug] = useState<string | null>(null)
  const [record, setRecord] = useState<VerifiedRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fromQuery = searchParams.get('slug')
    const resolved = fromQuery ?? sessionStorage.getItem(LAST_TENANT_KEY)
    if (fromQuery) sessionStorage.setItem(LAST_TENANT_KEY, fromQuery)
    setSlug(resolved)
  }, [searchParams])

  useEffect(() => {
    if (!slug) return
    setError(null)
    setRecord(null)

    fetch(`/api/tenant-record?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load')
        return res.json() as Promise<VerifiedRecord>
      })
      .then(setRecord)
      .catch((err) => setError(err.message))
  }, [slug])

  if (!slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No business loaded</CardTitle>
            <CardDescription>
              Go back to the landing page and click "See it work" to load Jorge's Auto Parts into
              a private sandbox.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/" className="text-sm text-blue underline underline-offset-4">
              Back to landing
            </a>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Couldn't load this business</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  if (!record) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray px-4">
        <p className="text-navy/60">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-blue">Verified record (read-only)</p>
          <h1 className="text-3xl font-extrabold text-navy">{record.profile.name}</h1>
          <p className="text-sm text-navy/50">/{record.profile.slug}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>What Jorge sells, straight from the verified record.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-navy/10">
              {record.products.map((product) => (
                <li key={product.name} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold text-navy">{product.name}</p>
                    {product.compatibility && (
                      <p className="text-sm text-navy/60">{product.compatibility}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-navy">
                      {formatPriceCents(product.priceCents, product.currency)}
                    </p>
                    <p className={`text-sm ${product.available ? 'text-navy/60' : 'text-orange'}`}>
                      {product.available ? 'In stock' : 'Unavailable'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-1">
              {[...record.hours]
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((entry) => (
                  <li key={entry.dayOfWeek} className="flex justify-between gap-4">
                    <span className="text-navy">{formatDayOfWeek(entry.dayOfWeek)}</span>
                    <span className="text-navy/60">{formatHoursEntry(entry)}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {record.policies.map((policy) => (
                <li key={policy.kind}>
                  <p className="text-sm font-semibold capitalize text-navy">{policy.kind}</p>
                  <p className="text-sm text-navy/70">{policy.body}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
