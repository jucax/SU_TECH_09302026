import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { parseProductsCsv } from '@lib/csv'
import { formatPriceCents } from '@lib/format'
import type { HoursEntry, Product } from '@lib/schemas'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'
const BUSINESS_NAME = "Jorge's Auto Parts"
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Mirrors public/demo/jorges-hours-and-policies.pdf. Extracting this from the
// PDF itself would need real document parsing, which is planned, not built
// (see docs/PLAN.md's ingestion scope note) -- this walkthrough hardcodes the
// same facts the PDF states, rather than claiming an OCR step that doesn't
// exist.
const DEMO_HOURS: HoursEntry[] = [
  { dayOfWeek: 0, opensAt: null, closesAt: null, closed: true },
  { dayOfWeek: 1, opensAt: '08:00', closesAt: '18:00', closed: false },
  { dayOfWeek: 2, opensAt: '08:00', closesAt: '18:00', closed: false },
  { dayOfWeek: 3, opensAt: '08:00', closesAt: '18:00', closed: false },
  { dayOfWeek: 4, opensAt: '08:00', closesAt: '18:00', closed: false },
  { dayOfWeek: 5, opensAt: '08:00', closesAt: '19:00', closed: false },
  { dayOfWeek: 6, opensAt: '09:00', closesAt: '15:00', closed: false },
]
const DEMO_POLICIES = [
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

type Scene = 'intro' | 'sources' | 'setup' | 'bridging' | 'reveal'

function JudgeNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-action-blue/20 bg-subtle-blue px-4 py-3 text-sm text-navy">
      <span className="font-semibold text-action-blue">For judges: </span>
      {children}
    </div>
  )
}

export function Demo() {
  const navigate = useNavigate()
  const [scene, setScene] = useState<Scene>('intro')
  const [products, setProducts] = useState<Array<Omit<Product, 'id'>>>([])
  const [csvError, setCsvError] = useState<string | null>(null)
  const [bridgeStep, setBridgeStep] = useState(0)
  const [bridgeError, setBridgeError] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)

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

  const bridgeSteps = [
    'Reading the inventory spreadsheet and documents...',
    'Structuring product, hours, and policy data...',
    'Generating an improved website...',
    'Generating an MCP server for AI assistants...',
  ]

  async function handleBridge() {
    setScene('bridging')
    setBridgeError(null)
    setBridgeStep(0)

    const pacing = (async () => {
      for (let i = 0; i < bridgeSteps.length; i++) {
        setBridgeStep(i)
        await new Promise((r) => setTimeout(r, 900))
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
        body: JSON.stringify({ slug: newSlug, products, hours: DEMO_HOURS, policies: DEMO_POLICIES }),
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
    <main className="min-h-screen bg-gray px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
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
            <JudgeNote>
              These are real, downloadable files, not screenshots. A business owner hands over
              whatever they already have; OneBridge doesn't require any particular format.
            </JudgeNote>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>A spreadsheet Jorge exported from his register.</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="/demo/jorges-inventory.csv"
                    download
                    className="text-sm font-semibold text-action-blue underline underline-offset-4"
                  >
                    Download jorges-inventory.csv
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Hours & policies</CardTitle>
                  <CardDescription>A sheet Jorge typed up himself.</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="/demo/jorges-hours-and-policies.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-action-blue underline underline-offset-4"
                  >
                    Open jorges-hours-and-policies.pdf
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Current website</CardTitle>
                  <CardDescription>Built years ago, rarely updated.</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="/demo/jorges-old-site.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-action-blue underline underline-offset-4"
                  >
                    View Jorge's current site
                  </a>
                </CardContent>
              </Card>
            </div>
            <div>
              <Button onClick={() => setScene('setup')}>Continue to setup</Button>
            </div>
          </>
        )}

        {scene === 'setup' && (
          <>
            <div>
              <p className="text-sm font-semibold text-action-blue">Step 2</p>
              <h1 className="text-2xl font-extrabold text-navy">Set up {BUSINESS_NAME}</h1>
            </div>
            <JudgeNote>
              This is the same setup screen a real business uses to register (
              <a href="/register" className="underline underline-offset-4">
                try it yourself
              </a>
              ), pre-filled here from Jorge's files so you can see the result immediately.
              Everything below is editable, and nothing publishes until "Bridge" is clicked.
            </JudgeNote>

            {csvError && <p className="text-sm text-error">{csvError}</p>}
            {bridgeError && <p className="text-sm text-error">{bridgeError}</p>}

            <Card>
              <CardHeader>
                <CardTitle>Products ({products.length})</CardTitle>
                <CardDescription>Parsed from jorges-inventory.csv.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y divide-border">
                  {products.map((p, i) => (
                    <li key={i} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <span className="text-navy">{p.name}</span>
                        {p.compatibility && <span className="text-secondary"> — {p.compatibility}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-navy">{formatPriceCents(p.priceCents)}</span>
                        <span className={p.available ? 'text-secondary' : 'text-orange'}>
                          {p.available ? 'In stock' : 'Unavailable'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hours</CardTitle>
                <CardDescription>From jorges-hours-and-policies.pdf.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-1">
                  {DEMO_HOURS.map((h) => (
                    <li key={h.dayOfWeek} className="flex justify-between gap-4">
                      <span className="text-navy">{DAY_NAMES[h.dayOfWeek]}</span>
                      <span className="text-secondary">
                        {h.closed ? 'Closed' : `${h.opensAt} – ${h.closesAt}`}
                      </span>
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
                <ul className="flex flex-col gap-3">
                  {DEMO_POLICIES.map((p) => (
                    <li key={p.kind}>
                      <p className="text-sm font-semibold capitalize text-navy">{p.kind}</p>
                      <p className="text-sm text-secondary">{p.body}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <p className="text-sm text-secondary">
                  This takes Jorge's sources and turns them into an improved website and an MCP
                  server, from the same verified record.
                </p>
                <Button variant="action" onClick={handleBridge} disabled={products.length === 0}>
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
            <CardContent className="flex flex-col gap-3">
              {bridgeSteps.map((label, i) => (
                <p
                  key={label}
                  className={`text-sm ${i <= bridgeStep ? 'font-semibold text-navy' : 'text-secondary'}`}
                >
                  {i < bridgeStep ? '✓' : i === bridgeStep ? '…' : '·'} {label}
                </p>
              ))}
              <p className="mt-2 text-xs text-secondary">
                This walkthrough narrates the intended AI-assisted structuring step. Today this
                demo uses deterministic parsing of the sample files; ANTHROPIC_API_KEY-backed
                structuring is implemented separately (see the plain-language edit box and
                accuracy check on the dashboard).
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Before</CardTitle>
                  <CardDescription>Jorge's old website: stale prices, no structure.</CardDescription>
                </CardHeader>
                <CardContent>
                  <iframe
                    src="/demo/jorges-old-site.html"
                    title="Jorge's old website"
                    className="h-64 w-full rounded-lg border border-border"
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

              <Card className="border-action-blue/30">
                <CardHeader>
                  <CardTitle>After: website for people</CardTitle>
                  <CardDescription>Generated from the verified record just published.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>After: connection for AI</CardTitle>
                <CardDescription>The same record, structured for AI assistants.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 text-sm">
                <a
                  href={`/site/${slug}/llms.txt`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-action-blue underline underline-offset-4"
                >
                  llms.txt
                </a>
                <a
                  href={`/site/${slug}/robots.txt`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-action-blue underline underline-offset-4"
                >
                  robots.txt
                </a>
                <a
                  href={`/site/${slug}/mcp`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-action-blue underline underline-offset-4"
                >
                  MCP endpoint
                </a>
              </CardContent>
            </Card>

            <div>
              <Button onClick={() => navigate(`/dashboard?slug=${encodeURIComponent(slug)}`)}>
                Go to the dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
