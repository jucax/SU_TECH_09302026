import { ArrowRight, Check, Database, Globe, Loader2, LockKeyhole, Server, Sparkles, TriangleAlert } from 'lucide-react'
import type { VerifiedRecord } from '@lib/schemas'
import { escapeHtml, formatDayOfWeek, formatHoursEntry, formatPriceCents } from '@lib/format'
import { cn } from '@/lib/utils'
import type { UpdatePhase } from './FrontDoorPreviews'
import type { UpdateOutcome } from './UpdateChat'
import './UpdateSync.css'

export function UpdateSync({ phase, before, current, outcome }: { phase: UpdatePhase; before: VerifiedRecord; current: VerifiedRecord; outcome: UpdateOutcome | null }) {
  const busy = ['understanding', 'applying', 'refreshing'].includes(phase)
  const complete = phase === 'done' || (!busy && outcome?.status === 'applied')
  const held = !busy && outcome?.status === 'review'
  const failed = !busy && outcome?.status === 'error'
  const visible = complete ? current : before
  const changed = current.products.find(p => { const old = before.products.find(o => p.id ? o.id === p.id : o.name === p.name); return !old || JSON.stringify(old) !== JSON.stringify(p) })
  const product = (complete ? changed : changed && before.products.find(p => changed.id ? p.id === changed.id : p.name === changed.name)) ?? visible.products[0]
  const prior = product && before.products.find(p => product.id ? p.id === product.id : p.name === product.name)
  const hoursChanged = JSON.stringify(before.hours) !== JSON.stringify(current.hours)
  const policiesChanged = JSON.stringify(before.policies) !== JSON.stringify(current.policies)
  const mode = changed ? 'product' : hoursChanged ? 'hours' : policiesChanged ? 'policies' : 'product'
  const html = mode === 'hours' ? visible.hours.map(h => `<li>${formatDayOfWeek(h.dayOfWeek)}: ${escapeHtml(formatHoursEntry(h))}</li>`).join('\n')
    : mode === 'policies' ? visible.policies.map(p => `<h3>${escapeHtml(p.kind)}</h3>\n<p>${escapeHtml(p.body)}</p>`).join('\n')
    : product ? `<h3>${escapeHtml(product.name)}</h3>\n<p class="product-price">${escapeHtml(formatPriceCents(product.priceCents, product.currency))}</p>\n<span>${product.available ? 'In stock' : 'Unavailable'}</span>` : '<!-- No products published -->'
  const json = mode === 'hours' ? visible.hours : mode === 'policies' ? visible.policies : product ? { name: product.name, priceCents: product.priceCents, currency: product.currency, price: formatPriceCents(product.priceCents, product.currency), available: product.available, compatibility: product.compatibility ?? null } : []
  const label = phase === 'understanding' ? 'Reading your request' : phase === 'applying' ? 'Saving the approved change' : phase === 'refreshing' ? 'Refreshing the shared record' : held ? 'Human review required' : failed ? 'Update not confirmed' : complete ? 'Website + MCP use the updated record' : 'Preparing your update'
  const Icon = busy ? Loader2 : held ? LockKeyhole : failed ? TriangleAlert : Check
  return <div className={cn('ob-update-sync mt-5 rounded-xl border bg-white p-4 sm:p-5', complete ? 'border-success/30' : held ? 'border-review/30' : 'border-border')} data-sync-state={busy ? phase : held ? 'review' : failed ? 'error' : complete ? 'complete' : 'idle'}>
    <div className="flex items-center gap-2" role="status" aria-live="polite"><Icon size={17} className={cn(busy && 'motion-safe:animate-spin', held ? 'text-review' : failed ? 'text-error' : complete ? 'text-success' : 'text-action-blue')} /><h3 className="text-sm font-bold text-navy">{label}</h3></div>
    <p className="mt-1 text-xs leading-relaxed text-secondary">{held ? 'Neither output has changed. Approve the request in the review queue before publishing.' : failed ? 'The update could not be confirmed. Reload the record before retrying if the change may have saved.' : 'One approved record powers the generated website HTML and live MCP responses.'}</p>
    <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_24px_1fr_24px_1fr]">
      <div className="ob-update-sync-node"><Sparkles size={18} /><div><strong>OneBridge AI</strong><small>{phase === 'understanding' ? 'Understanding your request' : 'Your requested change'}</small></div></div><ArrowRight className="hidden text-border sm:block" size={20} />
      <div className={cn('ob-update-sync-node', busy && 'ob-update-sync-active', complete && 'ob-update-sync-complete')}><Database size={18} /><div><strong>Approved record</strong><small>{held ? 'Change held for review' : complete ? 'Change saved' : phase === 'applying' ? 'Applying governance + saving' : 'Shared source of truth'}</small></div></div><ArrowRight className="hidden text-border sm:block" size={20} />
      <div className={cn('ob-update-sync-node', phase === 'refreshing' && 'ob-update-sync-active', complete && 'ob-update-sync-complete')}><Check size={18} /><div><strong>Two connected outputs</strong><small>{complete ? 'Both read the same new values' : 'Website HTML + MCP data'}</small></div></div>
    </div>
    {complete && mode === 'product' && product && prior && prior.priceCents !== product.priceCents && <p className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-navy"><span>{product.name}</span><span className="text-secondary line-through">{formatPriceCents(prior.priceCents, prior.currency)}</span><ArrowRight size={13} /><span className="rounded bg-success-surface px-2 py-1 text-success">{formatPriceCents(product.priceCents, product.currency)}</span><span className="text-secondary">Shared by both outputs</span></p>}
    <div className="mt-4 grid gap-3 md:grid-cols-2">{[{ name: 'Website · HTML data preview', icon: Globe, code: html }, { name: 'MCP · response data preview', icon: Server, code: JSON.stringify(json, null, 2) }].map(output => <div key={output.name} className={cn('ob-update-sync-output overflow-hidden rounded-lg bg-navy', phase === 'refreshing' && 'ob-update-sync-stream', complete && 'ob-update-sync-output-done')}><div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-white/75"><span className="flex items-center gap-2"><output.icon size={14} />{output.name}</span>{complete && <Check size={14} className="text-emerald-300" />}</div><pre className="max-h-36 overflow-auto p-3 font-mono text-[11px] leading-5 text-white/90">{output.code}</pre></div>)}</div>
    <p className="mt-3 text-[11px] leading-relaxed text-secondary">{complete ? 'Approved values refreshed. Open the website or AI connection to inspect the result.' : 'Published values stay visible until an approved change is confirmed.'} Previews show published-data excerpts.</p>
  </div>
}
