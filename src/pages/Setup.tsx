import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { parseProductsCsv } from '@lib/csv'
import { formatPriceCents } from '@lib/format'
import type { HoursEntry, Policy, Product } from '@lib/schemas'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_HOURS: HoursEntry[] = DAY_NAMES.map((_, dayOfWeek) => ({
  dayOfWeek,
  opensAt: dayOfWeek === 0 ? null : '09:00',
  closesAt: dayOfWeek === 0 ? null : '17:00',
  closed: dayOfWeek === 0,
}))

const POLICY_KINDS = ['returns', 'pickup', 'warranty'] as const

export function Setup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [slug, setSlug] = useState<string | null>(searchParams.get('slug'))
  const [businessName, setBusinessName] = useState('')
  const [creatingTenant, setCreatingTenant] = useState(false)

  const [products, setProducts] = useState<Array<Omit<Product, 'id'>>>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [newProduct, setNewProduct] = useState({ name: '', price: '', compatibility: '' })

  const [hours, setHours] = useState<HoursEntry[]>(DEFAULT_HOURS)
  const [policies, setPolicies] = useState<Record<string, string>>({})

  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('slug')) setSlug(searchParams.get('slug'))
  }, [searchParams])

  async function handleCreateBusiness(e: React.FormEvent) {
    e.preventDefault()
    setCreatingTenant(true)
    setPublishError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Please log in again.')

      const res = await fetch('/api/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: businessName }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not create your business')
      sessionStorage.setItem(LAST_TENANT_KEY, body.slug)
      setSlug(body.slug)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCreatingTenant(false)
    }
  }

  function handleAddProduct() {
    const priceNum = Number(newProduct.price)
    if (!newProduct.name.trim() || !Number.isFinite(priceNum) || priceNum < 0) return
    setProducts((prev) => [
      ...prev,
      {
        name: newProduct.name.trim(),
        priceCents: Math.round(priceNum * 100),
        currency: 'USD',
        available: true,
        compatibility: newProduct.compatibility.trim() || null,
        description: null,
      },
    ])
    setNewProduct({ name: '', price: '', compatibility: '' })
  }

  function handleCsvFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const result = parseProductsCsv(text)
      setProducts((prev) => [...prev, ...result.products])
      setCsvErrors(result.errors.map((e) => `Row ${e.row}: ${e.message}`))
    }
    reader.readAsText(file)
  }

  function updateHour(dayOfWeek: number, patch: Partial<HoursEntry>) {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)))
  }

  async function handlePublish() {
    if (!slug) return
    setPublishing(true)
    setPublishError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Please log in again.')

      const policyList: Policy[] = POLICY_KINDS.filter((kind) => policies[kind]?.trim()).map(
        (kind) => ({ kind, body: policies[kind].trim() }),
      )

      const res = await fetch('/api/setup-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug, products, hours, policies: policyList }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not publish your business')

      sessionStorage.setItem(LAST_TENANT_KEY, slug)
      navigate(`/dashboard?slug=${encodeURIComponent(slug)}`)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPublishing(false)
    }
  }

  if (!slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>What's your business called?</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={handleCreateBusiness}>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name"
                className="rounded-full border border-navy/20 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
              />
              {publishError && <p className="text-sm text-orange">{publishError}</p>}
              <Button type="submit" disabled={creatingTenant}>
                {creatingTenant ? 'Creating...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-blue">Setup wizard</p>
          <h1 className="text-3xl font-extrabold text-navy">Add your business information</h1>
          <p className="mt-1 text-sm text-navy/60">
            Nothing here is published until you review it below and click Publish.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Add a few by hand, or upload a CSV.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                className="flex-1 rounded-full border border-navy/20 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                className="w-28 rounded-full border border-navy/20 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
              />
              <input
                type="text"
                placeholder="Compatibility (optional)"
                value={newProduct.compatibility}
                onChange={(e) => setNewProduct((p) => ({ ...p, compatibility: e.target.value }))}
                className="flex-1 rounded-full border border-navy/20 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
              />
              <Button type="button" variant="secondary" onClick={handleAddProduct}>
                Add
              </Button>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])}
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Upload CSV
              </Button>
              <span className="ml-2 text-xs text-navy/50">
                Columns: name, priceCents (or price), available, compatibility
              </span>
              {csvErrors.length > 0 && (
                <ul className="mt-2 text-xs text-orange">
                  {csvErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>

            {products.length > 0 && (
              <ul className="flex flex-col divide-y divide-navy/10">
                {products.map((p, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-navy">
                      {p.name}
                      {p.compatibility && <span className="text-navy/50"> — {p.compatibility}</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-navy/70">{formatPriceCents(p.priceCents)}</span>
                      <button
                        type="button"
                        onClick={() => setProducts((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-orange"
                        aria-label={`Remove ${p.name}`}
                      >
                        &times;
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {hours.map((h) => (
                <li key={h.dayOfWeek} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-navy">{DAY_NAMES[h.dayOfWeek]}</span>
                  <label className="flex items-center gap-1 text-navy/60">
                    <input
                      type="checkbox"
                      checked={h.closed}
                      onChange={(e) => updateHour(h.dayOfWeek, { closed: e.target.checked })}
                    />
                    Closed
                  </label>
                  {!h.closed && (
                    <>
                      <input
                        type="time"
                        value={h.opensAt ?? ''}
                        onChange={(e) => updateHour(h.dayOfWeek, { opensAt: e.target.value })}
                        className="rounded border border-navy/20 px-2 py-1"
                      />
                      <span className="text-navy/40">to</span>
                      <input
                        type="time"
                        value={h.closesAt ?? ''}
                        onChange={(e) => updateHour(h.dayOfWeek, { closesAt: e.target.value })}
                        className="rounded border border-navy/20 px-2 py-1"
                      />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policies</CardTitle>
            <CardDescription>Optional. Leave blank to skip.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {POLICY_KINDS.map((kind) => (
              <div key={kind}>
                <label className="mb-1 block text-sm font-semibold capitalize text-navy">
                  {kind}
                </label>
                <textarea
                  value={policies[kind] ?? ''}
                  onChange={(e) => setPolicies((prev) => ({ ...prev, [kind]: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review and publish</CardTitle>
            <CardDescription>
              {products.length} product{products.length === 1 ? '' : 's'} will go live at
              /site/{slug}, with an MCP server and llms.txt generated from the same data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {publishError && <p className="mb-2 text-sm text-orange">{publishError}</p>}
            <Button onClick={handlePublish} disabled={publishing || products.length === 0}>
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
