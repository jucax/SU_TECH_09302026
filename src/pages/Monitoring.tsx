import { useEffect, useState } from 'react'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTenantSlug } from '@/lib/tenantSession'
import type { VerifiedRecord } from '@lib/schemas'

interface ClaimDiffEntry {
  subject: string
  field: string
  claimedValue: string
  actualValue: string | null
  status: 'match' | 'mismatch' | 'unverifiable'
}
interface ClaimDiffResult {
  entries: ClaimDiffEntry[]
  matches: number
  mismatches: number
  unverifiable: number
  accuracyScore: number
}
interface ToolEvidence {
  tool: string
  input: unknown
  result: unknown
  isError: boolean
}
interface MonitorResult {
  prompt: string
  withoutMcp: { answer: string; abstained: boolean; diff: ClaimDiffResult }
  withMcp: { answer: string; abstained: boolean; diff: ClaimDiffResult; toolEvidence: ToolEvidence[] }
}

const STATUS_STYLES: Record<ClaimDiffEntry['status'], string> = {
  match: 'text-success',
  mismatch: 'text-error',
  unverifiable: 'text-secondary',
}
const STATUS_LABELS: Record<ClaimDiffEntry['status'], string> = {
  match: 'Matches',
  mismatch: 'Mismatch',
  unverifiable: 'Not verifiable',
}

function DiffTable({ diff }: { diff: ClaimDiffResult }) {
  if (diff.entries.length === 0) {
    return <p className="text-sm text-secondary">No checkable claims were made.</p>
  }

  const scored = diff.matches + diff.mismatches

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-secondary">
            <th className="pb-1 font-medium">Subject</th>
            <th className="pb-1 font-medium">Field</th>
            <th className="pb-1 font-medium">Claimed</th>
            <th className="pb-1 font-medium">Actual</th>
            <th className="pb-1 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {diff.entries.map((entry, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-1.5 pr-2 text-navy">{entry.subject}</td>
              <td className="py-1.5 pr-2 text-secondary">{entry.field}</td>
              <td className="py-1.5 pr-2 text-secondary">{entry.claimedValue}</td>
              <td className="py-1.5 pr-2 text-secondary">{entry.actualValue ?? 'Unknown'}</td>
              <td className={`py-1.5 font-semibold ${STATUS_STYLES[entry.status]}`}>
                {STATUS_LABELS[entry.status]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {scored > 0 ? (
        <p className="text-sm text-secondary">
          {diff.matches}/{scored} verifiable claims correct
          {diff.unverifiable > 0 && ` (${diff.unverifiable} not verifiable)`}, accuracy score{' '}
          <span className="font-semibold text-navy">{(diff.accuracyScore * 100).toFixed(0)}%</span>
        </p>
      ) : (
        <p className="text-sm text-secondary">
          No verifiable claims to score{diff.unverifiable > 0 && ` (${diff.unverifiable} not verifiable)`}.
        </p>
      )}
    </div>
  )
}

export function Monitoring() {
  const slug = useTenantSlug()
  const [record, setRecord] = useState<VerifiedRecord | null>(null)
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<MonitorResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/tenant-record?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data: VerifiedRecord) => {
        setRecord(data)
        const firstProduct = data.products[0]
        if (firstProduct) {
          setPrompt(
            `What's the price of the ${firstProduct.name} at ${data.profile.name}, and is it in stock?`,
          )
        }
      })
      .catch(() => {})
  }, [slug])

  async function runComparison() {
    if (!slug || !prompt.trim()) return
    setRunning(true)
    setRunError(null)
    setResult(null)
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, prompt }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to run comparison')
      setResult(body as MonitorResult)
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setRunning(false)
    }
  }

  if (!slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No business loaded</CardTitle>
            <CardDescription>
              Go back to the landing page and click "See it work" first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/" className="text-sm text-action-blue underline underline-offset-4">
              Back to landing
            </a>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <DashboardLayout slug={slug}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-action-blue">Accuracy check</p>
          <h1 className="text-3xl font-extrabold text-navy">
            {record?.profile.name ?? 'Loading...'}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Same question, same model, same shared settings. One answer can use this business's
            MCP tools; the other cannot.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 text-sm text-secondary">
            Both panels below ask <span className="font-semibold text-navy">claude-sonnet-5</span> the
            exact same question, with the exact same settings, in parallel API calls. The only
            difference is whether this business's MCP server is attached. The "with MCP" panel makes
            real tool calls against this business's live MCP endpoint, and every call it makes is
            recorded the same as any other MCP client's would be.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ask a question</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runComparison()}
                className="flex-1 rounded-[10px] border border-border px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-action-blue"
                disabled={running}
              />
              <Button variant="action" onClick={runComparison} disabled={running || !prompt.trim()}>
                {running ? 'Running...' : 'Run comparison'}
              </Button>
            </div>
            {runError && <p className="mt-2 text-sm text-error">{runError}</p>}
            {!result && !running && (
              <p className="mt-3 text-sm text-secondary">
                Running will show two answers, a field-by-field accuracy check against this
                business's verified record, and (for the connected side) the actual tool calls made.
              </p>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Without MCP</CardTitle>
                <CardDescription>General knowledge only, no tools available.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="rounded-lg bg-gray p-3 text-sm text-navy">{result.withoutMcp.answer}</p>
                <DiffTable diff={result.withoutMcp.diff} />
              </CardContent>
            </Card>

            <Card className="border-action-blue/30">
              <CardHeader>
                <CardTitle>With MCP</CardTitle>
                <CardDescription>Connected to this business's live MCP server.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="rounded-lg bg-subtle-blue p-3 text-sm text-navy">
                  {result.withMcp.answer}
                </p>
                <DiffTable diff={result.withMcp.diff} />
                {result.withMcp.toolEvidence.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold text-navy">
                      Tool calls made ({result.withMcp.toolEvidence.length})
                    </summary>
                    <ul className="mt-2 flex flex-col gap-1">
                      {result.withMcp.toolEvidence.map((call, i) => (
                        <li key={i} className="rounded bg-gray p-2 font-mono text-xs text-secondary">
                          <span className="text-navy">{call.tool}</span>
                          {call.input != null && ` ${JSON.stringify(call.input)}`}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
