import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleHelp,
  FileSpreadsheet,
  FileText,
  Globe,
  ImagePlus,
  LoaderCircle,
  type LucideIcon,
  Pencil,
  Plus,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { parseProductsCsv } from '@lib/csv'
import { formatPriceCents } from '@lib/format'
import type { HoursEntry, Policy, Product } from '@lib/schemas'
import '@/pages/Workflow.css'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'
const BUSINESS_NAME = "Jorge's Auto Parts"
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Mirrors public/demo/jorges-hours-and-policies.pdf. Extracting this from the
// PDF itself would need real document parsing, which is planned, not built
// (see docs/PLAN.md's ingestion scope note) -- this walkthrough hardcodes the
// same facts the PDF states, rather than claiming an OCR step that doesn't
// exist. Both are editable below, same as a real owner reviewing the record.
const DEMO_HOURS: HoursEntry[] = [
  { dayOfWeek: 0, opensAt: null, closesAt: null, closed: true },
  { dayOfWeek: 1, opensAt: '08:00', closesAt: '18:00', closed: false },
  { dayOfWeek: 2, opensAt: '08:00', closesAt: '18:00', closed: false },
  { dayOfWeek: 3, opensAt: '08:00', closesAt: '18:00', closed: false },
  { dayOfWeek: 4, opensAt: '08:00', closesAt: '18:00', closed: false },
  { dayOfWeek: 5, opensAt: '08:00', closesAt: '19:00', closed: false },
  { dayOfWeek: 6, opensAt: '09:00', closesAt: '15:00', closed: false },
]
const DEMO_POLICIES: Policy[] = [
  {
    kind: 'returns',
    body: 'Unused parts in original packaging may be returned within 30 days with a receipt for a full refund. Electrical parts and special orders are final sale.',
  },
  {
    kind: 'pickup',
    body: 'In-store pickup is available same day for in-stock items ordered before 3 PM.',
  },
  {
    kind: 'warranty',
    body: "All parts carry the manufacturer's standard warranty. Jorge's Auto Parts offers a 90-day workmanship guarantee on any installation performed in-store.",
  },
]

// Jorge supplied an existing website, so a real cleaning pass would also look
// for brand color/logo material there. He doesn't have a usable logo, which
// this list says plainly rather than silently skipping it -- a real owner in
// this position would be asked to upload one (see the Logo card in setup).
const CLEANING_STEPS = [
  'Cleaning the data',
  'Finding relationships between items',
  'Finding products',
  'Finding business hours and policies',
  'Finding a matching color palette from your website',
  "Looking for a logo — none found, we'll ask you to upload one",
]

const BRIDGE_STEPS = [
  'Structuring product, hours, and policy data',
  'Generating an improved website',
  'Generating an MCP server for AI assistants',
  'Publishing llms.txt and robots.txt',
]

type Scene = 'intro' | 'sources' | 'cleaning' | 'setup' | 'bridging' | 'reveal'

interface ProductDraft {
  name: string
  price: string
  compatibility: string
  available: boolean
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-action-blue/20 bg-subtle-blue px-4 py-3 text-sm text-navy">
      {children}
    </div>
  )
}

function StepList({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="ob-processing-list" aria-live="polite" aria-label="Setup progress">
      {steps.map((label, i) => (
        <li key={label} className={i < current ? 'is-complete' : i === current ? 'is-active' : ''}>
          <span className="ob-processing-icon" aria-hidden="true">
            {i < current ? <Check size={16} /> : i === current ? <LoaderCircle size={16} className="motion-safe:animate-spin" /> : <span>{String(i + 1).padStart(2, '0')}</span>}
          </span>
          <span>{label}</span>
          {i === current && <span className="sr-only">In progress</span>}
          {i < current && <span className="sr-only">Complete</span>}
        </li>
      ))}
    </ol>
  )
}

function SourceTile({
  href,
  download,
  icon: Icon,
  title,
  description,
}: {
  href: string
  download?: boolean
  icon: LucideIcon
  title: string
  description: string
}) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}${href}` : href
  return (
    <a
      href={href}
      download={download}
      target={download ? undefined : '_blank'}
      rel={download ? undefined : 'noreferrer'}
      className="flex flex-col items-center gap-2 rounded-lg border border-border bg-white p-4 text-center transition-colors hover:border-action-blue/40 hover:bg-subtle-blue/40"
    >
      <Icon className="h-6 w-6 text-action-blue" aria-hidden="true" />
      <span className="text-sm font-semibold text-navy">{title}</span>
      <span className="text-xs text-secondary">{description}</span>
      <span className="mt-1 break-all font-mono text-[11px] text-secondary/80">{url}</span>
    </a>
  )
}

// A tap-to-toggle explainer for judges/owners who aren't developers, next to
// each AI-facing element in the reveal step. Click instead of hover so it
// works on touch devices too, and it's a sibling of the tile's link/button
// rather than nested inside it -- a <button> inside an <a> would double as a
// broken nested-interactive-element and would navigate on every tap.
function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        aria-label={`What is ${label}?`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-secondary hover:border-action-blue hover:text-action-blue"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-white p-3 text-left text-xs font-normal normal-case leading-snug text-navy shadow-card"
        >
          {children}
        </span>
      )}
    </span>
  )
}

function iconButtonClass(variant: 'neutral' | 'danger' = 'neutral') {
  return `inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white ${
    variant === 'danger' ? 'text-error hover:bg-error-surface' : 'text-secondary hover:bg-subtle-blue hover:text-navy'
  }`
}

const inputClass =
  'rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-action-blue'

export function Demo() {
  const navigate = useNavigate()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [scene, setScene] = useState<Scene>('intro')
  const [products, setProducts] = useState<Array<Omit<Product, 'id'>>>([])
  const [csvError, setCsvError] = useState<string | null>(null)
  const [cleaningStep, setCleaningStep] = useState(0)
  const [bridgeStep, setBridgeStep] = useState(0)
  const [bridgeError, setBridgeError] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)

  const [hours, setHours] = useState<HoursEntry[]>(DEMO_HOURS)
  const [policies, setPolicies] = useState<Policy[]>(DEMO_POLICIES)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)

  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
  const [productDraft, setProductDraft] = useState<ProductDraft | null>(null)

  const [editingHours, setEditingHours] = useState(false)
  const [hoursDraft, setHoursDraft] = useState<HoursEntry[]>(DEMO_HOURS)

  const [editingPolicies, setEditingPolicies] = useState(false)
  const [policiesDraft, setPoliciesDraft] = useState<Policy[]>(DEMO_POLICIES)

  useEffect(() => {
    fetch('/demo/jorges-inventory.csv')
      .then((res) => res.text())
      .then((text) => {
        const result = parseProductsCsv(text)
        setProducts(result.products)
        if (result.errors.length > 0) {
          setCsvError(result.errors.map((e) => `Row ${e.row}: ${e.message}`).join('; '))
        }
      })
      .catch(() => setCsvError('Could not load the sample inventory file.'))
  }, [])

  async function handleContinueToSetup() {
    setScene('cleaning')
    setCleaningStep(0)
    for (let i = 0; i < CLEANING_STEPS.length; i++) {
      setCleaningStep(i)
      await new Promise((r) => setTimeout(r, 1400))
    }
    setScene('setup')
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

  function addProduct() {
    const index = products.length
    setProducts((prev) => [
      ...prev,
      { name: '', priceCents: 0, currency: 'USD', available: true, compatibility: null, description: null },
    ])
    setProductDraft({ name: '', price: '0.00', compatibility: '', available: true })
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

  function cancelEditProduct(index: number) {
    setEditingProductIndex(null)
    setProductDraft(null)
    // A row added via "Add product" and cancelled before its first save has
    // nothing worth keeping.
    if (products[index] && !products[index].name.trim()) {
      setProducts((prev) => prev.filter((_, i) => i !== index))
    }
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index))
    if (editingProductIndex === index) {
      setEditingProductIndex(null)
      setProductDraft(null)
    }
  }

  function startEditHours() {
    setHoursDraft(hours)
    setEditingHours(true)
  }

  function updateHoursDraft(dayOfWeek: number, patch: Partial<HoursEntry>) {
    setHoursDraft((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)))
  }

  function saveHours() {
    setHours(hoursDraft)
    setEditingHours(false)
  }

  function startEditPolicies() {
    setPoliciesDraft(policies)
    setEditingPolicies(true)
  }

  function updatePolicyDraft(index: number, patch: Partial<Policy>) {
    setPoliciesDraft((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function addPolicyDraft() {
    setPoliciesDraft((prev) => [...prev, { kind: '', body: '' }])
  }

  function removePolicyDraft(index: number) {
    setPoliciesDraft((prev) => prev.filter((_, i) => i !== index))
  }

  function savePolicies() {
    setPolicies(policiesDraft.filter((p) => p.kind.trim() && p.body.trim()))
    setEditingPolicies(false)
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
      reader.readAsDataURL(file)
    })
  }

  async function handleLogoFile(file: File) {
    setLogoDataUrl(await readFileAsDataUrl(file))
  }

  // The pre-made logo lives as a static SVG file, same as Jorge's other
  // sample documents -- read it the same way a real upload is read, rather
  // than special-casing a path string, so it goes through the identical
  // publish path a real owner's upload would.
  async function useJorgesLogo() {
    const res = await fetch('/demo/jorges-logo.svg')
    const svgText = await res.text()
    const base64 = btoa(unescape(encodeURIComponent(svgText)))
    setLogoDataUrl(`data:image/svg+xml;base64,${base64}`)
  }

  async function handleBridge() {
    setScene('bridging')
    setBridgeError(null)
    setBridgeStep(0)

    const publishableProducts = products.filter((p) => p.name.trim())

    const pacing = (async () => {
      for (let i = 0; i < BRIDGE_STEPS.length; i++) {
        setBridgeStep(i)
        await new Promise((r) => setTimeout(r, 1600))
      }
    })()

    const work = (async () => {
      const startRes = await fetch('/api/demo-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'fresh', name: BUSINESS_NAME }),
      })
      const startBody = await startRes.json()
      if (!startRes.ok) throw new Error(startBody.error ?? 'Could not create the sandbox business')
      const newSlug = startBody.slug as string

      const publishRes = await fetch('/api/setup-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newSlug,
          products: publishableProducts,
          hours,
          policies,
          logoDataUrl,
        }),
      })
      const publishBody = await publishRes.json()
      if (!publishRes.ok) throw new Error(publishBody.error ?? 'Could not publish the business')

      return newSlug
    })()

    try {
      const [, newSlug] = await Promise.all([pacing, work])
      sessionStorage.setItem(LAST_TENANT_KEY, newSlug)
      setSlug(newSlug)
      setScene('reveal')
    } catch (err) {
      setBridgeError(err instanceof Error ? err.message : 'Something went wrong')
      setScene('setup')
    }
  }

  return (
    <main className="ob-workflow-page ob-demo-page min-h-screen bg-gray px-4 pb-12">
      <header className="ob-workflow-header">
        <a href="/" aria-label="OneBridge home"><img src="/brand/logo-primary.png" alt="OneBridge" /></a>
        <span>GUIDED LIVE DEMO</span>
      </header>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <nav className="ob-demo-progress" aria-label="Demo stages">
          {['Sources', 'Clean & review', 'Publish', 'Two front doors'].map((label, index) => {
            const stage = scene === 'intro' || scene === 'sources' ? 0 : scene === 'cleaning' ? 1 : scene === 'setup' ? 2 : scene === 'bridging' ? 2 : 3
            const complete = index < stage
            const active = index === stage
            return (
              <div key={label} className={complete ? 'is-complete' : active ? 'is-active' : ''} aria-current={active ? 'step' : undefined}>
                <div className="ob-demo-stage-label">
                  <span>{complete ? <Check size={14} /> : `0${index + 1}`}</span>
                  <small>{label}</small>
                </div>
                {index < 3 && <span className="ob-demo-connector" aria-hidden="true" />}
              </div>
            )
          })}
        </nav>
        <div className="ob-demo-scenes flex flex-col gap-6">
        {scene === 'intro' && (
          <Card>
            <CardHeader>
              <CardTitle>Meet Jorge</CardTitle>
              <CardDescription>A local auto parts store owner, and OneBridge's first customer.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-navy">
                Jorge knows his shop better than anyone: what's in stock, what things cost, who a
                part fits. But when a customer asks an AI assistant where to find brake parts
                nearby, Jorge might not come up at all, or the assistant might get his price or
                stock wrong.
              </p>
              <p className="text-secondary">
                Jorge has a spreadsheet, a typed-up sheet of hours and policies, and a basic website
                his nephew built years ago. This walkthrough follows what happens when he signs up
                for OneBridge.
              </p>
              <div>
                <Button onClick={() => setScene('sources')}>See how Jorge sets up</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {scene === 'sources' && (
          <>
            <div>
              <p className="text-sm font-semibold text-action-blue">Step 1</p>
              <h1 className="text-2xl font-extrabold text-navy">What Jorge already has</h1>
            </div>
            <Note>
              You can download or open each file below. These are the real, unedited files Jorge
              sent over — OneBridge doesn't require any particular format to get started.
            </Note>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SourceTile
                href="/demo/jorges-inventory.csv"
                download
                icon={FileSpreadsheet}
                title="Inventory"
                description="A spreadsheet Jorge exported from his register."
              />
              <SourceTile
                href="/demo/jorges-hours-and-policies.pdf"
                icon={FileText}
                title="Hours & policies"
                description="A sheet Jorge typed up himself."
              />
              <SourceTile
                href="/demo/jorges-old-site.html"
                icon={Globe}
                title="Current website"
                description="Built years ago, rarely updated."
              />
            </div>
            <div>
              <Button onClick={handleContinueToSetup}>Continue to setup</Button>
            </div>
          </>
        )}

        {scene === 'cleaning' && (
          <Card>
            <CardHeader>
              <CardTitle>Reading Jorge's files</CardTitle>
              <CardDescription>Turning a spreadsheet, a PDF, and a website into one record.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <StepList steps={CLEANING_STEPS} current={cleaningStep} />
              <p className="text-xs text-secondary">
                This walkthrough narrates the intended AI-assisted cleaning step. Today, this demo
                parses the sample files deterministically; AI-backed structuring is implemented
                separately (see the plain-language edit box on the dashboard).
              </p>
            </CardContent>
          </Card>
        )}

        {scene === 'setup' && (
          <>
            <div>
              <p className="text-sm font-semibold text-action-blue">Step 2</p>
              <h1 className="text-2xl font-extrabold text-navy">Set up {BUSINESS_NAME}</h1>
            </div>
            <Note>
              This is the same setup screen used when a business registers, already filled in from
              what we just read. Everything below is editable, so Jorge can fix anything the
              cleaning step got wrong before it ever goes live.
            </Note>

            {csvError && <p className="text-sm text-error">{csvError}</p>}
            {bridgeError && <p className="text-sm text-error">{bridgeError}</p>}

            <Card>
              <CardHeader>
                <CardTitle>Products ({products.length})</CardTitle>
                <CardDescription>
                  Parsed from jorges-inventory.csv. Fix anything the parser got wrong, or add one by
                  hand.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          <button
                            type="button"
                            onClick={saveProduct}
                            aria-label="Save product"
                            className={iconButtonClass()}
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelEditProduct(i)}
                            aria-label="Cancel editing"
                            className={iconButtonClass()}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ) : (
                      <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <div className="min-w-0">
                          <span className="text-navy">{p.name || '(unnamed product)'}</span>
                          {p.compatibility && <span className="text-secondary"> — {p.compatibility}</span>}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="font-semibold text-navy">{formatPriceCents(p.priceCents)}</span>
                          <span className={p.available ? 'text-secondary' : 'text-orange'}>
                            {p.available ? 'In stock' : 'Unavailable'}
                          </span>
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
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={editingProductIndex !== null}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-action-blue disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add product
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Hours</CardTitle>
                  <CardDescription>From jorges-hours-and-policies.pdf.</CardDescription>
                </div>
                {!editingHours && (
                  <button
                    type="button"
                    onClick={startEditHours}
                    aria-label="Edit hours"
                    className={iconButtonClass()}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </CardHeader>
              <CardContent>
                {editingHours ? (
                  <div className="flex flex-col gap-2">
                    <ul className="flex flex-col gap-2">
                      {hoursDraft.map((h) => (
                        <li key={h.dayOfWeek} className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="w-24 text-navy">{DAY_NAMES[h.dayOfWeek]}</span>
                          <label className="flex items-center gap-1.5 text-secondary">
                            <input
                              type="checkbox"
                              checked={h.closed}
                              onChange={(e) => updateHoursDraft(h.dayOfWeek, { closed: e.target.checked })}
                            />
                            Closed
                          </label>
                          {!h.closed && (
                            <>
                              <input
                                type="time"
                                value={h.opensAt ?? ''}
                                onChange={(e) => updateHoursDraft(h.dayOfWeek, { opensAt: e.target.value })}
                                className={inputClass}
                              />
                              <span className="text-secondary">to</span>
                              <input
                                type="time"
                                value={h.closesAt ?? ''}
                                onChange={(e) => updateHoursDraft(h.dayOfWeek, { closesAt: e.target.value })}
                                className={inputClass}
                              />
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-1 flex gap-2">
                      <Button size="sm" onClick={saveHours}>
                        Save hours
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingHours(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-1">
                    {hours.map((h) => (
                      <li key={h.dayOfWeek} className="flex justify-between gap-4">
                        <span className="text-navy">{DAY_NAMES[h.dayOfWeek]}</span>
                        <span className="text-secondary">
                          {h.closed ? 'Closed' : `${h.opensAt} – ${h.closesAt}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Policies</CardTitle>
                {!editingPolicies && (
                  <button
                    type="button"
                    onClick={startEditPolicies}
                    aria-label="Edit policies"
                    className={iconButtonClass()}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </CardHeader>
              <CardContent>
                {editingPolicies ? (
                  <div className="flex flex-col gap-3">
                    {policiesDraft.map((p, i) => (
                      <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Policy name, e.g. returns"
                            value={p.kind}
                            onChange={(e) => updatePolicyDraft(i, { kind: e.target.value })}
                            className={`${inputClass} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => removePolicyDraft(i)}
                            aria-label="Remove policy"
                            className={iconButtonClass('danger')}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <textarea
                          value={p.body}
                          onChange={(e) => updatePolicyDraft(i, { body: e.target.value })}
                          rows={2}
                          className={`${inputClass} w-full`}
                        />
                      </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={addPolicyDraft}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-action-blue"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" /> Add policy
                      </button>
                      <Button size="sm" onClick={savePolicies}>
                        Save policies
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingPolicies(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {policies.map((p) => (
                      <li key={p.kind}>
                        <p className="text-sm font-semibold capitalize text-navy">{p.kind}</p>
                        <p className="text-sm text-secondary">{p.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>
                  We didn't find a usable logo on Jorge's old site, same as the cleaning step said.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
                />
                {logoDataUrl ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-20 items-center rounded-lg border border-border bg-white px-4">
                      <img src={logoDataUrl} alt="Jorge's Auto Parts logo" className="h-14 w-auto object-contain" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()}>
                        Replace logo
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setLogoDataUrl(null)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-gray px-4 py-6 text-center">
                    <ImagePlus className="h-6 w-6 text-secondary" aria-hidden="true" />
                    <p className="text-sm text-secondary">
                      Add one to complete Jorge's brand identity on the new site.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button size="sm" onClick={() => logoInputRef.current?.click()}>
                        Upload a logo
                      </Button>
                      <Button size="sm" variant="secondary" onClick={useJorgesLogo}>
                        Use Jorge's logo
                      </Button>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-xs text-secondary">
                  This will publish with the record below and appear on the generated site and the
                  dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <p className="text-sm text-secondary">
                  This takes Jorge's sources and turns them into an improved website and an MCP
                  server, from the same verified record.
                </p>
                <Button
                  variant="action"
                  onClick={handleBridge}
                  disabled={products.filter((p) => p.name.trim()).length === 0 || editingProductIndex !== null}
                >
                  Bridge
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {scene === 'bridging' && (
          <Card>
            <CardHeader>
              <CardTitle>Building {BUSINESS_NAME}'s two front doors</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <StepList steps={BRIDGE_STEPS} current={bridgeStep} />
              <p className="text-xs text-secondary">
                Today this step uses deterministic parsing of the sample files, not a live AI call
                (that path exists separately -- see the dashboard's plain-language edit box and
                accuracy check).
              </p>
            </CardContent>
          </Card>
        )}

        {scene === 'reveal' && slug && (
          <>
            <div>
              <p className="text-sm font-semibold text-action-blue">Step 3</p>
              <h1 className="text-2xl font-extrabold text-navy">One record, two front doors</h1>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
              <Card className="flex flex-col md:flex-1">
                <CardHeader>
                  <CardTitle>Before</CardTitle>
                  <CardDescription>Jorge's old website: stale prices, no structure.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <iframe
                    src="/demo/jorges-old-site.html"
                    title="Jorge's old website"
                    className="min-h-64 w-full flex-1 rounded-lg border border-border"
                  />
                  <a
                    href="/demo/jorges-old-site.html"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-action-blue underline underline-offset-4"
                  >
                    Open in a new tab
                  </a>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center md:w-12 md:flex-none md:flex-col md:justify-around">
                <ArrowDown className="h-6 w-6 text-action-blue md:hidden" aria-hidden="true" />
                <ArrowRight className="hidden h-6 w-6 text-action-blue md:block" aria-hidden="true" />
                <ArrowRight className="hidden h-6 w-6 text-action-blue md:block" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-4 md:flex-1">
                <Card className="border-action-blue/30">
                  <CardHeader>
                    <CardTitle>After: website for people</CardTitle>
                    <CardDescription>Generated from the verified record just published.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div>
                      <iframe
                        src={`/site/${slug}`}
                        title="Generated website"
                        className="h-64 w-full rounded-lg border border-border"
                      />
                      <a
                        href={`/site/${slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm font-semibold text-action-blue underline underline-offset-4"
                      >
                        Open in a new tab
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                      <div className="relative flex flex-col items-center gap-1.5 rounded-lg border border-border bg-gray p-3 text-center hover:border-action-blue/40">
                        <div className="absolute right-1.5 top-1.5">
                          <InfoTip label="llms.txt">
                            A plain-text page that states Jorge's real hours, prices, and policies
                            in a format AI systems can read directly, instead of guessing from the
                            website's design.
                          </InfoTip>
                        </div>
                        <a
                          href={`/site/${slug}/llms.txt`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col items-center gap-1.5"
                        >
                          <FileText className="h-5 w-5 text-action-blue" aria-hidden="true" />
                          <span className="text-sm font-semibold text-navy">llms.txt</span>
                          <span className="text-xs text-secondary">States the facts, in plain text</span>
                        </a>
                      </div>
                      <div className="relative flex flex-col items-center gap-1.5 rounded-lg border border-border bg-gray p-3 text-center hover:border-action-blue/40">
                        <div className="absolute right-1.5 top-1.5">
                          <InfoTip label="robots.txt">
                            Tells AI crawlers and search engines by name that they're welcome to
                            read this site, instead of leaving them to guess whether they're
                            allowed.
                          </InfoTip>
                        </div>
                        <a
                          href={`/site/${slug}/robots.txt`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col items-center gap-1.5"
                        >
                          <ShieldCheck className="h-5 w-5 text-action-blue" aria-hidden="true" />
                          <span className="text-sm font-semibold text-navy">robots.txt</span>
                          <span className="text-xs text-secondary">Welcomes AI crawlers by name</span>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-action-blue/30 bg-subtle-blue">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>After: MCP server for AI</CardTitle>
                      <InfoTip label="MCP server">
                        A live connection AI assistants can plug into to ask this business
                        questions directly and get the current answer, instead of just reading a
                        static page that might be stale.
                      </InfoTip>
                    </div>
                    <CardDescription>The same record, served as a live connection.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard?slug=${encodeURIComponent(slug)}`)}
                      className="flex w-full items-center gap-3 rounded-lg border border-action-blue bg-white p-4 text-left hover:bg-subtle-blue/70"
                    >
                      <Server className="h-6 w-6 shrink-0 text-action-blue" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-semibold text-navy">MCP server</span>
                        <span className="block text-xs text-secondary">A live connection, not a document — open in the dashboard</span>
                      </span>
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <Button onClick={() => navigate(`/dashboard?slug=${encodeURIComponent(slug)}`)}>
                Go to the dashboard
              </Button>
            </div>
          </>
        )}
        </div>
      </div>
    </main>
  )
}
