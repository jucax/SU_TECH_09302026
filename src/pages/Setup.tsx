import { Check, ImagePlus, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { WorkflowFrame } from '@/components/WorkflowFrame'
import '@/pages/Workflow.css'
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

interface ProductDraft {
  name: string
  price: string
  compatibility: string
  available: boolean
}

function iconButtonClass(variant: 'neutral' | 'danger' = 'neutral') {
  return `inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white ${
    variant === 'danger' ? 'text-error hover:bg-error-surface' : 'text-secondary hover:bg-subtle-blue hover:text-navy'
  }`
}

const inputClass =
  'rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-action-blue'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function Setup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const csvInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [slug, setSlug] = useState<string | null>(searchParams.get('slug'))
  const [businessName, setBusinessName] = useState('')
  const [creatingTenant, setCreatingTenant] = useState(false)

  const [products, setProducts] = useState<Array<Omit<Product, 'id'>>>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [newProduct, setNewProduct] = useState({ name: '', price: '', compatibility: '' })
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
  const [productDraft, setProductDraft] = useState<ProductDraft | null>(null)

  const [hours, setHours] = useState<HoursEntry[]>(DEFAULT_HOURS)
  const [policies, setPolicies] = useState<Policy[]>([])

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

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

      const res = await fetch('/api/tenant', {
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

  function startEditProduct(index: number) {
    const p = products[index]
    setProductDraft({
      name: p.name,
      price: (p.priceCents / 100).toFixed(2),
      compatibility: p.compatibility ?? '',
      available: p.available,
    })
    setEditingProductIndex(index)
  }

  function saveProduct() {
    if (editingProductIndex === null || !productDraft) return
    const priceNum = Number(productDraft.price)
    if (!productDraft.name.trim() || !Number.isFinite(priceNum) || priceNum < 0) return
    setProducts((prev) =>
      prev.map((p, i) =>
        i === editingProductIndex
          ? {
              ...p,
              name: productDraft.name.trim(),
              priceCents: Math.round(priceNum * 100),
              compatibility: productDraft.compatibility.trim() || null,
              available: productDraft.available,
            }
          : p,
      ),
    )
    setEditingProductIndex(null)
    setProductDraft(null)
  }

  function cancelEditProduct() {
    setEditingProductIndex(null)
    setProductDraft(null)
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index))
    if (editingProductIndex === index) {
      setEditingProductIndex(null)
      setProductDraft(null)
    }
  }

  function updateHour(dayOfWeek: number, patch: Partial<HoursEntry>) {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)))
  }

  function addPolicy() {
    setPolicies((prev) => [...prev, { kind: '', body: '' }])
  }

  function updatePolicy(index: number, patch: Partial<Policy>) {
    setPolicies((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function removePolicy(index: number) {
    setPolicies((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleLogoFile(file: File) {
    setLogoError(null)
    try {
      setLogoDataUrl(await readFileAsDataUrl(file))
    } catch {
      setLogoError('Could not read that file. Try a different image.')
    }
  }

  async function handlePublish() {
    if (!slug) return
    setPublishing(true)
    setPublishError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Please log in again.')

      const publishablePolicies = policies.filter((p) => p.kind.trim() && p.body.trim())

      const res = await fetch('/api/setup-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug, products, hours, policies: publishablePolicies, logoDataUrl }),
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
      <WorkflowFrame title="Start with your business name." description="You can bring products and policies later, and nothing is published before you review it.">
        <Card className="w-full max-w-md">
          <CardHeader>
            <p className="ob-workflow-kicker"><span /> CREATE YOUR BUSINESS SPACE</p>
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
                className={inputClass}
              />
              {publishError && <p className="text-sm text-error">{publishError}</p>}
              <Button type="submit" disabled={creatingTenant}>
                {creatingTenant ? <><LoaderCircle size={16} className="motion-safe:animate-spin" /> Creating...</> : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </WorkflowFrame>
    )
  }

  return (
    <main className="ob-workflow-page ob-setup-page min-h-screen bg-gray px-4 pb-12">
      <header className="ob-workflow-header">
        <a href="/" aria-label="OneBridge home"><img src="/brand/logo-primary.png" alt="OneBridge" /></a>
        <span>BUSINESS SETUP</span>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <p className="ob-workflow-kicker"><span /> YOUR BUSINESS, YOUR INFORMATION</p>
          <h1 className="text-3xl font-extrabold text-navy">Add your business information</h1>
          <p className="mt-1 text-sm text-secondary">
            Nothing here is published until you review it below and click Publish. Everything is
            editable, including anything a CSV upload got wrong.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
            <CardDescription>Add a few by hand, or upload a CSV.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                className={`${inputClass} flex-1`}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                className={`${inputClass} w-28`}
              />
              <input
                type="text"
                placeholder="Compatibility (optional)"
                value={newProduct.compatibility}
                onChange={(e) => setNewProduct((p) => ({ ...p, compatibility: e.target.value }))}
                className={`${inputClass} flex-1`}
              />
              <Button type="button" variant="secondary" onClick={handleAddProduct}>
                Add
              </Button>
            </div>

            <div>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])}
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => csvInputRef.current?.click()}>
                Upload CSV
              </Button>
              <span className="ml-2 text-xs text-secondary">
                Columns: name, priceCents (or price), available, compatibility
              </span>
              {csvErrors.length > 0 && (
                <ul className="mt-2 text-xs text-error">
                  {csvErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>

            {products.length > 0 && (
              <ul className="flex flex-col divide-y divide-border">
                {products.map((p, i) =>
                  editingProductIndex === i && productDraft ? (
                    <li key={i} className="flex flex-col gap-2 py-3">
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          placeholder="Product name"
                          value={productDraft.name}
                          onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })}
                          className={`${inputClass} flex-1`}
                          autoFocus
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          value={productDraft.price}
                          onChange={(e) => setProductDraft({ ...productDraft, price: e.target.value })}
                          className={`${inputClass} w-28`}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          placeholder="Compatibility (optional)"
                          value={productDraft.compatibility}
                          onChange={(e) => setProductDraft({ ...productDraft, compatibility: e.target.value })}
                          className={`${inputClass} flex-1`}
                        />
                        <label className="flex items-center gap-1.5 whitespace-nowrap text-sm text-navy">
                          <input
                            type="checkbox"
                            checked={productDraft.available}
                            onChange={(e) => setProductDraft({ ...productDraft, available: e.target.checked })}
                          />
                          In stock
                        </label>
                        <button type="button" onClick={saveProduct} aria-label="Save product" className={iconButtonClass()}>
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditProduct}
                          aria-label="Cancel editing"
                          className={iconButtonClass()}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-navy">
                        {p.name}
                        {p.compatibility && <span className="text-secondary"> — {p.compatibility}</span>}
                      </span>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-navy">{formatPriceCents(p.priceCents)}</span>
                        <button
                          type="button"
                          onClick={() => startEditProduct(i)}
                          aria-label={`Edit ${p.name}`}
                          disabled={editingProductIndex !== null}
                          className={`${iconButtonClass()} disabled:opacity-40`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProduct(i)}
                          aria-label={`Remove ${p.name}`}
                          disabled={editingProductIndex !== null}
                          className={`${iconButtonClass('danger')} disabled:opacity-40`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ),
                )}
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
                <li key={h.dayOfWeek} className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="w-24 text-navy">{DAY_NAMES[h.dayOfWeek]}</span>
                  <label className="flex items-center gap-1.5 text-secondary">
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
                        className={inputClass}
                      />
                      <span className="text-secondary">to</span>
                      <input
                        type="time"
                        value={h.closesAt ?? ''}
                        onChange={(e) => updateHour(h.dayOfWeek, { closesAt: e.target.value })}
                        className={inputClass}
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
            <CardDescription>Optional. Add as many as you need, e.g. returns, pickup, warranty.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {policies.map((p, i) => (
              <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Policy name, e.g. returns"
                    value={p.kind}
                    onChange={(e) => updatePolicy(i, { kind: e.target.value })}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removePolicy(i)}
                    aria-label="Remove policy"
                    className={iconButtonClass('danger')}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <textarea
                  value={p.body}
                  onChange={(e) => updatePolicy(i, { body: e.target.value })}
                  rows={2}
                  placeholder="What's the policy?"
                  className={`${inputClass} w-full`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addPolicy}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-action-blue"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add policy
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Optional, but it'll appear on your generated website and dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
            />
            {logoError && <p className="mb-2 text-sm text-error">{logoError}</p>}
            {logoDataUrl ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-20 items-center rounded-lg border border-border bg-white px-4">
                  <img src={logoDataUrl} alt="Your logo" className="h-14 w-auto object-contain" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()}>
                    Replace
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setLogoDataUrl(null)}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-gray px-4 py-6 text-center">
                <ImagePlus className="h-6 w-6 text-secondary" aria-hidden="true" />
                <p className="text-sm text-secondary">PNG, JPEG, WEBP, or SVG, up to 2MB.</p>
                <Button size="sm" onClick={() => logoInputRef.current?.click()}>
                  Upload a logo
                </Button>
              </div>
            )}
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
            {publishError && <p className="mb-2 text-sm text-error">{publishError}</p>}
            <Button
              onClick={handlePublish}
              disabled={publishing || products.length === 0 || editingProductIndex !== null}
            >
              {publishing ? <><LoaderCircle size={16} className="motion-safe:animate-spin" /> Publishing...</> : 'Publish'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
