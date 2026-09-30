import { useState } from 'react'
import { ArrowUpRight, Check, Copy, Globe, Pencil, Server } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatPriceCents } from '@lib/format'
import type { Product } from '@lib/schemas'

export type EditTarget = 'website' | 'mcp'

// Phases the frontend can actually observe: structure call, apply call, then
// the record refetch. "done" only lasts long enough to flash the new values.
export type UpdatePhase = 'idle' | 'understanding' | 'applying' | 'refreshing' | 'done'

const PHASE_LABEL: Record<UpdatePhase, string> = {
  idle: '',
  understanding: 'Reading your request...',
  applying: 'Updating the approved record...',
  refreshing: 'Syncing...',
  done: 'Updated',
}

interface PreviewProps {
  product: Product | undefined
  businessName: string
  slug: string
  phase: UpdatePhase
  selected: EditTarget
  onEdit: (target: EditTarget) => void
}

function PhaseBar({ phase }: { phase: UpdatePhase }) {
  const busy = phase === 'understanding' || phase === 'applying' || phase === 'refreshing'
  return (
    <div className="h-5 text-xs" role="status" aria-live="polite">
      {phase !== 'idle' && (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-semibold',
            phase === 'done' ? 'text-success' : 'text-action-blue',
          )}
        >
          {busy ? (
            <span className="h-2 w-2 rounded-full bg-action-blue motion-safe:animate-pulse" />
          ) : (
            <Check size={14} aria-hidden="true" />
          )}
          {PHASE_LABEL[phase]}
        </span>
      )}
    </div>
  )
}

function cardRing(selected: boolean, phase: UpdatePhase) {
  return cn(
    'flex flex-col gap-3 p-5 transition-shadow duration-300',
    selected && 'ring-2 ring-action-blue/40',
    phase === 'done' && 'motion-safe:shadow-[0_0_0_4px_rgba(22,101,52,0.15)]',
  )
}

export function WebsitePreview({ product, businessName, slug, phase, selected, onEdit }: PreviewProps) {
  const done = phase === 'done'
  return (
    <Card className={cardRing(selected === 'website', phase)}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe size={22} aria-hidden="true" className="text-action-blue" />
          <h3 className="text-base font-bold text-navy">Website for people</h3>
        </div>
        <a
          href={`/site/${slug}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Open website in a new tab"
          className="text-secondary hover:text-navy"
        >
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </header>

      {/* Lightweight HTML mini-preview built from the same record, not an iframe. */}
      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        <div className="flex items-center gap-1.5 border-b border-border bg-gray px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="ml-2 truncate text-[11px] text-secondary">/site/{slug}</span>
        </div>
        <div className="flex min-h-[132px] flex-col gap-2 p-4">
          <p className="text-xs font-semibold text-secondary">{businessName}</p>
          {product ? (
            <>
              <p className="text-sm font-bold text-navy">{product.name}</p>
              <p
                className={cn(
                  'w-fit rounded px-1 text-xl font-extrabold tabular-nums text-navy transition-colors duration-700',
                  done && 'bg-success-surface text-success',
                )}
              >
                {formatPriceCents(product.priceCents, product.currency)}
              </p>
              <p className={cn('text-xs', product.available ? 'text-secondary' : 'text-error')}>
                {product.available ? 'In stock' : 'Unavailable'}
              </p>
            </>
          ) : (
            <p className="text-sm text-secondary">No products published</p>
          )}
        </div>
      </div>

      <PhaseBar phase={selected === 'website' ? phase : phase === 'idle' ? 'idle' : 'refreshing'} />
      <button
        type="button"
        onClick={() => onEdit('website')}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-navy hover:bg-subtle-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2"
      >
        <Pencil size={16} aria-hidden="true" /> Edit with AI
      </button>
    </Card>
  )
}

export function McpPreview({ product, slug, phase, selected, onEdit }: PreviewProps) {
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const endpoint = `${window.location.origin}/site/${slug}/mcp`
  const done = phase === 'done'

  // Display adapter over the same record. Labeled as a preview, not the raw
  // tool response, per docs/DASHBOARD_STYLE_PLAN.md section 7.
  const json = product
    ? JSON.stringify(
        {
          name: product.name,
          price: formatPriceCents(product.priceCents, product.currency),
          available: product.available,
          compatibility: product.compatibility ?? 'unknown',
        },
        null,
        2,
      )
    : null

  async function copy() {
    try {
      await navigator.clipboard.writeText(endpoint)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Card className={cardRing(selected === 'mcp', phase)}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Server size={22} aria-hidden="true" className="text-action-blue" />
          <h3 className="text-base font-bold text-navy">MCP for AI assistants</h3>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy MCP endpoint"
          className="text-secondary hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
        >
          {copied === 'ok' ? (
            <Check size={18} aria-hidden="true" />
          ) : (
            <Copy size={18} aria-hidden="true" />
          )}
        </button>
      </header>

      <div className="flex min-h-[176px] flex-col overflow-hidden rounded-[10px] bg-navy">
        <p className="border-b border-white/10 px-3 py-2 text-[11px] text-white/60">
          Approved data preview
        </p>
        {json ? (
          <pre
            className={cn(
              'flex-1 overflow-x-auto p-3 font-mono text-xs leading-relaxed text-white/90 transition-colors duration-700',
              done && 'bg-emerald-900/40',
            )}
          >
            {json}
          </pre>
        ) : (
          <p className="p-3 text-sm text-white/70">No products published</p>
        )}
      </div>

      <p className="min-h-4 break-all text-[11px] text-secondary" role="status">
        {copied === 'fail' ? 'Could not copy. Select the URL manually.' : endpoint}
      </p>

      <PhaseBar phase={selected === 'mcp' ? phase : phase === 'idle' ? 'idle' : 'refreshing'} />
      <button
        type="button"
        onClick={() => onEdit('mcp')}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-navy hover:bg-subtle-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2"
      >
        <Pencil size={16} aria-hidden="true" /> Edit with AI
      </button>
    </Card>
  )
}
