import { useEffect, useRef, useState } from 'react'
import { Check, Copy, FileJson, Info, LockKeyhole, Server, Sparkles, X } from 'lucide-react'
import type { VerifiedRecord } from '@lib/schemas'
import { cn } from '@/lib/utils'

const fieldHelp: Record<string, string> = {
  profile: 'The business identity attached to this connection.',
  name: 'The business or product name approved by the owner.',
  slug: 'The unique business identifier used in the storefront and connection URL.',
  logoUrl: 'The owner’s uploaded logo. Decorative storefront images are not verified product facts.',
  products: 'The approved catalog shared by your website and AI connection.',
  description: 'The owner’s product description, shared as business content.',
  priceCents: 'The numeric price in the smallest currency unit. For USD, 899 means $8.99.',
  currency: 'The currency of the listed price, such as USD.',
  available: 'Approved stock status. This does not reserve stock or query a live checkout system.',
  compatibility: 'The listed vehicle or use compatibility. A null value means unknown; AI should not guess.',
  hours: 'The approved weekly opening schedule.',
  dayOfWeek: 'Day number: 0 is Sunday, 1 is Monday, through 6 for Saturday.',
  opensAt: 'Local opening time in 24-hour format, when specified.',
  closesAt: 'Local closing time in 24-hour format, when specified.',
  closed: 'Whether the business is closed on this day.',
  policies: 'The approved business policies, such as returns, pickup, and warranty.',
  kind: 'The type of business policy.',
  body: 'The owner-approved policy text. AI should communicate it without inventing exceptions.',
}

const tools = [
  { name: 'getBusinessProfile', title: 'Know your business', description: 'Reads your business name, identifier, and opening hours.', input: 'No input required.' },
  { name: 'listProducts', title: 'Explore your catalog', description: 'Reads descriptions, prices, stock, and listed compatibility. An optional search matches product names, descriptions, or compatibility.', input: 'Optional: query — a product or vehicle search term.' },
  { name: 'checkAvailability', title: 'Check a specific part', description: 'Reads the approved price and stock for an exact or unique product match. Multiple matches are returned for clarification.', input: 'Required: productName — the product to check.' },
  { name: 'getPolicies', title: 'Understand your policies', description: 'Reads your returns, pickup, warranty, and other published policies.', input: 'Optional: kind — a policy type, such as returns.' },
]

interface Props {
  record: VerifiedRecord
  phase: string
  onClose: () => void
  onUpdate: () => void
}

export function McpInspector({ record, phase, onClose, onUpdate }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<'data' | 'tools' | 'connection'>('data')
  const [section, setSection] = useState<'profile' | 'products' | 'hours' | 'policies'>('products')
  const [field, setField] = useState('products')
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const endpoint = `${window.location.origin}/site/${record.profile.slug}/mcp`
  const busy = ['understanding', 'applying', 'refreshing'].includes(phase)
  // This is an approved-record display, not source code or a raw MCP response.
  const data = { profile: record.profile, products: record.products.map(({ id: _id, ...product }) => product), hours: record.hours, policies: record.policies }
  const lines = JSON.stringify({ [section]: data[section] }, null, 2).split('\n')

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  async function copy() {
    try { await navigator.clipboard.writeText(endpoint); setCopied('ok') }
    catch { setCopied('fail') }
  }

  function update() {
    dialog.current?.close()
    onClose()
    requestAnimationFrame(onUpdate)
  }

  return (
    <dialog ref={dialog} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }} aria-labelledby="mcp-inspector-title" aria-describedby="mcp-inspector-summary" className="m-auto max-h-[90dvh] w-[calc(100%-24px)] max-w-5xl overflow-y-auto rounded-2xl border border-border bg-white p-0 text-navy shadow-2xl backdrop:bg-navy/60">
      <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-action-blue"><Server size={16} aria-hidden="true" /> YOUR FRONT DOOR FOR AI</div><h2 id="mcp-inspector-title" className="text-xl font-bold sm:text-2xl">AI connection</h2><p id="mcp-inspector-summary" className="mt-1 text-sm text-secondary">Explore what compatible AI assistants can read about {record.profile.name}.</p></div>
        <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close AI connection" className="rounded-lg p-2 hover:bg-gray focus-visible:ring-2 focus-visible:ring-action-blue"><X size={20} /></button>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-subtle-blue/40 px-5 py-3 sm:px-6"><span className="flex items-center gap-2 text-xs font-semibold"><LockKeyhole size={14} /> Read-only · {busy ? 'Update in progress' : 'Shared approved record'}</span><span className="text-xs text-secondary">Your website and AI connection use the same information.</span></div>
      <div className="flex gap-1 border-b border-border px-5 pt-3 sm:px-6" role="group" aria-label="Inspector views">{([['data', 'Approved data'], ['tools', 'AI tools'], ['connection', 'Connection']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={cn('min-h-11 rounded-t-lg border-b-2 px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-action-blue', tab === value ? 'border-action-blue bg-subtle-blue text-action-blue' : 'border-transparent text-secondary hover:bg-gray')}>{label}</button>)}</div>
      <div className="p-5 sm:p-6">
        {tab === 'data' && <><div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Data sections">{(['profile', 'products', 'hours', 'policies'] as const).map(key => <button key={key} type="button" aria-pressed={section === key} onClick={() => { setSection(key); setField(key) }} className={cn('min-h-10 rounded-lg border px-3 text-xs font-semibold capitalize focus-visible:ring-2 focus-visible:ring-action-blue', section === key ? 'border-action-blue bg-subtle-blue text-action-blue' : 'border-border hover:bg-gray')}>{key}{key !== 'profile' && ` (${data[key].length})`}</button>)}</div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]"><div className="min-w-0 overflow-hidden rounded-xl bg-navy"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/60"><span className="flex items-center gap-2"><FileJson size={14} /> approved-record.json</span><span>Preview · Read-only</span></div><pre aria-label="Approved business data, read-only" className="max-h-[360px] overflow-auto p-3 text-xs leading-6 text-white/90">{lines.map((line, index) => { const key = line.match(/^\s*"([^\"]+)":/)?.[1]; return <span key={index} className="block"><span aria-hidden="true" className="mr-3 inline-block w-6 select-none text-right text-white/30">{index + 1}</span>{key && fieldHelp[key] ? <button type="button" aria-label={`Explain ${key}`} title={fieldHelp[key]} onMouseEnter={() => setField(key)} onFocus={() => setField(key)} onClick={() => setField(key)} className={cn('rounded text-left hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300', field === key && 'text-sky-300')}>{line}</button> : line}</span> })}</pre></div>
          <aside className="rounded-xl border border-border bg-gray p-4"><Info size={19} className="mb-3 text-action-blue" /><h3 className="font-mono text-sm font-bold">{field}</h3><p className="mt-2 text-sm leading-relaxed text-secondary" aria-live="polite">{fieldHelp[field]}</p><p className="mt-5 text-xs leading-relaxed text-secondary">Hover, focus, or tap a field to learn what it means. To change these values, use OneBridge AI below.</p></aside></div><p className="mt-3 text-xs text-secondary">A preview of the approved record, not server source code. Tool responses return the relevant fields for each request.</p></>}
        {tab === 'tools' && <div className="grid gap-3 sm:grid-cols-2">{tools.map(tool => <article key={tool.name} className="rounded-xl border border-border p-4"><span className="text-[10px] font-bold uppercase tracking-wide text-action-blue">Read-only tool</span><h3 className="mt-1 font-semibold">{tool.title}</h3><code className="mt-1 block break-all text-xs text-action-blue">{tool.name}</code><p className="mt-3 text-sm leading-relaxed text-secondary">{tool.description}</p><p className="mt-3 border-t border-border pt-3 text-xs text-secondary">{tool.input}</p></article>)}<p className="text-xs text-secondary sm:col-span-2">Availability comes from the approved record. These tools cannot purchase, reserve stock, or change your business information.</p></div>}
        {tab === 'connection' && <div className="space-y-4"><div className="rounded-xl border border-border bg-gray p-4"><h3 className="text-sm font-semibold">Your MCP endpoint</h3><code className="mt-2 block select-text break-all text-xs leading-relaxed">{endpoint}</code><button type="button" onClick={copy} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-action-blue">{copied === 'ok' ? <Check size={15} /> : <Copy size={15} />} {copied === 'ok' ? 'Copied' : 'Copy connection URL'}</button><p role="status" className="mt-2 text-xs text-secondary">{copied === 'fail' ? 'Copy failed. Select and copy the URL above.' : 'Public, read-only connection. No owner credentials needed.'}</p></div><p className="text-sm leading-relaxed text-secondary">Add this URL to a compatible MCP client using Streamable HTTP. The client uses POST to initialize and discover the tools. Opening this endpoint as a browser page does not connect an AI assistant.</p><a href={`/site/${record.profile.slug}/llms.txt`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-action-blue underline underline-offset-4">View business facts and connection instructions ↗</a></div>}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-gray p-5 sm:p-6"><p className="max-w-md text-xs leading-relaxed text-secondary">Keep both front doors consistent. Request changes through OneBridge AI; uncertain changes still go through human review.</p><button type="button" onClick={update} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-action-blue px-4 text-sm font-semibold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2"><Sparkles size={17} /> Update with OneBridge AI</button></footer>
    </dialog>
  )
}
