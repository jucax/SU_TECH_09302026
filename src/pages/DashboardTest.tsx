import { useMemo, useState } from 'react'
import { ArrowRight, Check, CircleHelp, FlaskConical, Loader2, X } from 'lucide-react'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useTenantData } from '@/components/dashboard/useTenantData'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatHoursEntry, formatPriceCents } from '@lib/format'
import type { VerifiedRecord } from '@lib/schemas'

type Verdict = 'match' | 'mismatch'

interface Claim {
  field: string
  said: string
  approved: string
  verdict: Verdict
}

interface Side {
  answer: string
  claims: Claim[]
  toolCalls: string[]
}

interface Scenario {
  id: string
  question: string
  withoutMcp: Side
  withMcp: Side
}

const norm = (s: string) => s.trim().toLowerCase()
const claim = (field: string, said: string, approved: string): Claim => ({
  field,
  said,
  approved,
  verdict: norm(said) === norm(approved) ? 'match' : 'mismatch',
})

// Scripted answers built from this tenant's own approved record, so the
// comparison always works with no AI provider. The "without MCP" side models
// an assistant guessing from general knowledge (one wrong guess, one
// abstention), which is what the live check may or may not show.
function buildScenarios(record: VerifiedRecord): Scenario[] {
  const out: Scenario[] = []
  const biz = record.profile.name

  const p = record.products[0]
  if (p) {
    const price = formatPriceCents(p.priceCents, p.currency)
    const stock = p.available ? 'In stock' : 'Unavailable'
    const guess = formatPriceCents(Math.max(0, p.priceCents - 500), p.currency)
    out.push({
      id: 'price',
      question: `How much is the ${p.name} at ${biz}, and is it in stock?`,
      withoutMcp: {
        answer: `I can't see ${biz}'s catalog. Parts like this usually cost about ${guess} and are often in stock.`,
        claims: [claim('Price', guess, price), claim('Availability', 'In stock', stock)],
        toolCalls: [],
      },
      withMcp: {
        answer: `The ${p.name} is ${price} and it is ${stock.toLowerCase()} right now.`,
        claims: [claim('Price', price, price), claim('Availability', stock, stock)],
        toolCalls: [`checkAvailability("${p.name}") returned ${price}, ${stock.toLowerCase()}`],
      },
    })
  }

  const monday = record.hours.find((h) => h.dayOfWeek === 1)
  if (monday) {
    const approved = formatHoursEntry(monday)
    out.push({
      id: 'hours',
      question: `What are ${biz}'s hours on Monday?`,
      withoutMcp: {
        answer: `Auto parts stores commonly run 8:00 AM to 5:00 PM on weekdays.`,
        claims: [claim('Monday hours', '8:00 AM to 5:00 PM', approved)],
        toolCalls: [],
      },
      withMcp: {
        answer: `${biz} is open ${approved} on Monday.`,
        claims: [claim('Monday hours', approved, approved)],
        toolCalls: [`getBusinessProfile() returned Monday ${approved}`],
      },
    })
  }

  const returns = record.policies.find((x) => x.kind === 'returns')
  if (returns) {
    out.push({
      id: 'returns',
      question: `What is ${biz}'s return policy?`,
      withoutMcp: {
        answer: `I don't have ${biz}'s return policy. Please check with the store directly.`,
        claims: [],
        toolCalls: [],
      },
      withMcp: {
        answer: `Returns: ${returns.body}`,
        claims: [claim('Return policy', returns.body, returns.body)],
        toolCalls: [`getPolicies("returns") returned the approved policy text`],
      },
    })
  }
  return out
}

const STEPS = [
  'Asking the question with no connection to the business',
  "Asking again, connected to this business's MCP server",
  'Pulling out each fact the answers state',
  'Comparing every fact to the approved record',
]

function scoreLine(claims: Claim[]) {
  if (claims.length === 0) return 'No facts stated (the assistant did not answer)'
  const ok = claims.filter((c) => c.verdict === 'match').length
  return `${ok} of ${claims.length} stated facts match`
}

function Panel({ title, tone, side }: { title: string; tone: 'plain' | 'mcp'; side: Side }) {
  return (
    <Card
      className={cn(
        'flex flex-col gap-3 p-5',
        tone === 'mcp' && 'border-action-blue/30 bg-subtle-blue/40',
      )}
    >
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <p className="rounded-[10px] bg-white p-3 text-sm text-navy">{side.answer}</p>

      {side.toolCalls.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-secondary">MCP tool calls made</p>
          <ul className="mt-1 flex flex-col gap-1">
            {side.toolCalls.map((t) => (
              <li key={t} className="break-words font-mono text-xs text-navy">
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold text-secondary">Facts checked against your record</p>
        {side.claims.length === 0 ? (
          <p className="text-sm text-secondary">Nothing to check. Abstaining is not counted as wrong.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-[10px] bg-white">
            {side.claims.map((c) => (
              <li key={c.field} className="flex items-start gap-3 p-3 text-sm">
                {c.verdict === 'match' ? (
                  <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <X size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-error" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">
                    {c.field}:{' '}
                    <span className={c.verdict === 'match' ? 'text-success' : 'text-error'}>
                      {c.verdict === 'match' ? 'Match' : 'Mismatch'}
                    </span>
                  </p>
                  <p className="text-xs text-secondary">
                    Said: {c.said}
                    {c.verdict === 'mismatch' && <> | Your record: {c.approved}</>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-auto text-sm font-bold text-navy">{scoreLine(side.claims)}</p>
    </Card>
  )
}

export function DashboardTest() {
  const { slug, record, activity, error } = useTenantData()
  const scenarios = useMemo(() => (record ? buildScenarios(record) : []), [record])
  const [selected, setSelected] = useState(0)
  const [step, setStep] = useState<number | null>(null)
  const [result, setResult] = useState<Scenario | null>(null)
  const q = slug ? `?slug=${encodeURIComponent(slug)}` : ''

  async function run() {
    const scenario = scenarios[selected]
    if (!scenario) return
    setResult(null)
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i)
      await new Promise((r) => setTimeout(r, 700))
    }
    setStep(null)
    setResult(scenario)
  }

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

  const running = step !== null

  return (
    <DashboardLayout
      slug={slug}
      businessName={record?.profile.name}
      pendingReview={activity?.reviewCounts.pending ?? 0}
    >
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-navy md:text-[28px]">Test</h1>
          <p className="text-sm text-secondary">
            See whether an AI assistant states your facts correctly, with and without your MCP
            server.
          </p>
        </header>

        <div
          role="note"
          className="flex items-start gap-2 rounded-[10px] border border-border bg-white px-4 py-3 text-sm text-navy"
        >
          <FlaskConical size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-action-blue" />
          <p>
            <span className="font-bold">Simulated example.</span> The answers below are scripted
            from your own approved record so this works without an AI account. They illustrate the
            method. They are not a measurement of any real assistant.
          </p>
        </div>

        <section aria-labelledby="how-heading" className="flex flex-col gap-3">
          <h2 id="how-heading" className="text-lg font-bold text-navy">
            What this test does
          </h2>
          <ol className="grid gap-3 md:grid-cols-4">
            {[
              ['1', 'Ask twice', 'The same question goes to the same AI model two times. Only one thing changes: whether it can use your MCP server.'],
              ['2', 'Collect facts', 'We pull out each concrete fact the answer states, such as a price, a stock status or opening hours.'],
              ['3', 'Compare', 'Each fact is checked against your approved record. It is a match, a mismatch, or not stated.'],
              ['4', 'Score', 'You see how many stated facts were right. If nothing was stated, nothing is counted as wrong.'],
            ].map(([n, title, body]) => (
              <li key={n} className="rounded-card border border-border bg-white p-4 shadow-card">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-subtle-blue text-sm font-bold text-action-blue">
                  {n}
                </span>
                <p className="mt-2 text-sm font-bold text-navy">{title}</p>
                <p className="text-xs text-secondary">{body}</p>
              </li>
            ))}
          </ol>
          <p className="text-xs text-secondary">
            What it shows: whether an assistant that is connected to your MCP server gets your
            facts right. What it does not show: that ChatGPT, Claude or Gemini will find or
            recommend your business on their own. That depends on each platform.
          </p>
        </section>

        <section aria-labelledby="run-heading" className="flex flex-col gap-3">
          <h2 id="run-heading" className="text-lg font-bold text-navy">
            Try it
          </h2>
          {!record ? (
            <p className="text-sm text-secondary">Loading...</p>
          ) : scenarios.length === 0 ? (
            <p className="text-sm text-secondary">
              Publish at least one product, hours or a policy to run a comparison.
            </p>
          ) : (
            <>
              <div role="radiogroup" aria-label="Question to ask" className="flex flex-col gap-2">
                {scenarios.map((s, i) => (
                  <label
                    key={s.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-[10px] border bg-white px-4 py-3 text-sm text-navy',
                      selected === i ? 'border-action-blue ring-2 ring-action-blue/20' : 'border-border',
                    )}
                  >
                    <input
                      type="radio"
                      name="question"
                      checked={selected === i}
                      disabled={running}
                      onChange={() => {
                        setSelected(i)
                        setResult(null)
                      }}
                    />
                    {s.question}
                  </label>
                ))}
              </div>
              <div>
                <Button onClick={run} disabled={running} className="min-h-[44px] gap-2">
                  {running ? (
                    <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" />
                  ) : null}
                  {running ? 'Running...' : 'Run the comparison'}
                </Button>
              </div>
            </>
          )}

          {running && (
            <ol className="flex flex-col gap-1 text-sm" role="status" aria-live="polite">
              {STEPS.map((label, i) => (
                <li
                  key={label}
                  className={cn(
                    'flex items-center gap-2',
                    i < step ? 'text-success' : i === step ? 'font-semibold text-navy' : 'text-secondary/50',
                  )}
                >
                  {i < step ? (
                    <Check size={14} aria-hidden="true" />
                  ) : i === step ? (
                    <Loader2 size={14} aria-hidden="true" className="motion-safe:animate-spin" />
                  ) : (
                    <CircleHelp size={14} aria-hidden="true" />
                  )}
                  {label}
                </li>
              ))}
            </ol>
          )}
        </section>

        {result && (
          <section aria-labelledby="result-heading" className="flex flex-col gap-3">
            <h2 id="result-heading" className="text-lg font-bold text-navy">
              Result
            </h2>
            <p className="text-sm text-secondary">Question: "{result.question}"</p>
            <div className="grid items-stretch gap-4 lg:grid-cols-2">
              <Panel title="Without your MCP server" tone="plain" side={result.withoutMcp} />
              <Panel title="Connected to your MCP server" tone="mcp" side={result.withMcp} />
            </div>
            <p className="text-xs text-secondary">
              In a real run the plain answer might be correct or might decline to answer. Both
              outcomes are recorded as they come out, without rerunning until one looks good.
            </p>
          </section>
        )}

        <Card className="flex flex-col gap-2 p-5">
          <h2 className="text-base font-bold text-navy">Run it for real</h2>
          <p className="text-sm text-secondary">
            The live check sends the question to an actual AI model twice and records what it says.
            It needs an AI account, so it is not part of the simulated example above.
          </p>
          <a
            href={`/dashboard/monitoring${q}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-action-blue underline underline-offset-4"
          >
            Open the live accuracy check <ArrowRight size={14} aria-hidden="true" />
          </a>
        </Card>
      </div>
    </DashboardLayout>
  )
}
