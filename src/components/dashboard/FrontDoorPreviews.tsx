import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Copy, Globe, Pencil, Server } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatPriceCents } from '@lib/format'
import { McpInspector } from './McpInspector'
import type { Product, VerifiedRecord } from '@lib/schemas'

// Phases the frontend can actually observe: structure call, apply call, then
// the record refetch. "done" only lasts long enough to flash the new values.
export type UpdatePhase = 'idle' | 'understanding' | 'applying' | 'refreshing' | 'done'

const PHASE_LABEL: Record<UpdatePhase, string> = {
  idle: '',
  understanding: 'Reading your request...',
  applying: 'Updating the approved record...',
  refreshing: 'Syncing...',
  done: 'Synced to the approved record',
}

interface PreviewProps {
  product: Product | undefined
  businessName: string
  logoUrl?: string | null
  slug: string
  phase: UpdatePhase
  onEdit: () => void
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

function cardRing(phase: UpdatePhase) {
  return cn(
    'flex h-full flex-col gap-3 p-5 transition-shadow duration-300',
    phase === 'done' && 'motion-safe:shadow-[0_0_0_4px_rgba(22,101,52,0.15)]',
  )
}

// The real generated site, shown as a scaled-down live page. It renders at a
// desktop width and is shrunk to fit the card, so it looks like the site, not a
// mock of it. Clicking anywhere on it opens the full site in a new tab.
const SITE_RENDER_WIDTH = 1200
const SITE_RENDER_HEIGHT = 800

function SiteFrame({ src, title, reloadKey }: { src: string; title: string; reloadKey: string }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.27)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / SITE_RENDER_WIDTH)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden bg-white"
      style={{ height: SITE_RENDER_HEIGHT * scale * 0.6 }}
    >
      <iframe
        key={reloadKey}
        src={src}
        title={title}
        tabIndex={-1}
        loading="lazy"
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{
          width: SITE_RENDER_WIDTH,
          height: SITE_RENDER_HEIGHT,
          transform: `scale(${scale})`,
        }}
      />
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        aria-label="Open website in a new tab"
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action-blue"
      />
    </div>
  )
}

export function WebsitePreview({ record, slug, phase, onEdit }: PreviewProps & { record: VerifiedRecord }) {
  const siteUrl = `/site/${slug}`
  // Reload the frame after each edit so it shows the freshly published values.
  const reloadKey = JSON.stringify({ slug, products: record.products, hours: record.hours, policies: record.policies })
  return (
    <Card className={cardRing(phase)}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe size={22} aria-hidden="true" className="text-action-blue" />
          <h3 className="text-base font-bold text-navy">Website for people</h3>
        </div>
        <a
          href={siteUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open website in a new tab"
          className="text-secondary hover:text-navy"
        >
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </header>

      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        <div className="flex items-center gap-1.5 border-b border-border bg-gray px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="ml-2 truncate text-[11px] text-secondary">{siteUrl}</span>
        </div>
        <SiteFrame src={siteUrl} title="Website for people preview" reloadKey={reloadKey} />
      </div>

      <div className="mt-auto flex flex-col gap-2">
      <PhaseBar phase={phase} />
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-navy hover:bg-subtle-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2"
      >
        <Pencil size={16} aria-hidden="true" /> Edit with AI
      </button>
      </div>
    </Card>
  )
}

export function McpPreview({ product, slug, phase, onEdit, record, inspectOnLoad = false }: PreviewProps & { record: VerifiedRecord; inspectOnLoad?: boolean }) {
  const [inspecting, setInspecting] = useState(inspectOnLoad)
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
    <Card className={cardRing(phase)}>
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

      <button type="button" onClick={() => setInspecting(true)} aria-label="Inspect the approved data available to AI" className="flex h-[184px] w-full flex-col overflow-hidden rounded-[10px] bg-navy text-left focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2">
        <p className="border-b border-white/10 px-3 py-2 text-[11px] text-white/60">
          Approved data preview · Click to inspect
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
      </button>

      <p className="line-clamp-1 break-all text-[11px] text-secondary" role="status">
        {copied === 'fail' ? 'Could not copy. Select the URL manually.' : endpoint}
      </p>

      <div className="mt-auto flex flex-col gap-2">
      <PhaseBar phase={phase} />
      <button
        type="button"
        onClick={() => setInspecting(true)}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-navy hover:bg-subtle-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2"
      >
        <Server size={16} aria-hidden="true" /> Inspect AI connection
      </button>
      </div>
      {inspecting && <McpInspector record={record} phase={phase} onClose={() => setInspecting(false)} onUpdate={onEdit} />}
    </Card>
  )
}
