import { useEffect, useRef, useState } from 'react'
import { Lock, Send, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UpdatePhase } from './FrontDoorPreviews'

export interface UpdateOutcome {
  status: 'applied' | 'review' | 'error'
  message: string
}

interface ChatMessage {
  from: 'owner' | 'ai'
  text: string
  status?: UpdateOutcome['status']
}

// Demo mode: the request is preloaded and locked, so a judge only clicks
// "Apply update". `request` is null once the script has run out.
export interface DemoScript {
  request: string | null
  step: number
  total: number
}

interface UpdateChatProps {
  phase: UpdatePhase
  demo: DemoScript | null
  example: string | null
  reviewHref: string
  onSubmit: (instruction: string) => Promise<UpdateOutcome>
}

export const UPDATE_INPUT_ID = 'onebridge-update-input'

export function UpdateChat({ phase, demo, example, reviewHref, onSubmit }: UpdateChatProps) {
  const [typed, setTyped] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const busy = phase !== 'idle' && phase !== 'done'

  const locked = demo !== null
  const text = locked ? (demo.request ?? '') : typed

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [messages.length])

  async function send() {
    const instruction = text.trim()
    if (!instruction || busy) return
    setMessages((m) => [...m, { from: 'owner', text: instruction }])
    if (!locked) setTyped('')
    const outcome = await onSubmit(instruction)
    // Failed updates give the owner their text back so they can retry.
    if (!locked && outcome.status === 'error') setTyped(instruction)
    setMessages((m) => [...m, { from: 'ai', text: outcome.message, status: outcome.status }])
  }

  return (
    <section
      aria-labelledby="update-heading"
      className="rounded-card border border-border border-l-4 border-l-action-blue bg-subtle-blue p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="update-heading" className="flex items-center gap-2 text-lg font-bold text-navy">
            <Sparkles size={20} aria-hidden="true" className="text-action-blue" />
            Update with OneBridge AI
          </h2>
          <p className="text-sm text-secondary">
            One request updates your website and your MCP server together. Routine updates apply;
            material changes go to review.
          </p>
        </div>
        {locked && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy">
            <Lock size={12} aria-hidden="true" />
            Demo: request preloaded
            {demo.request && ` (${demo.step} of ${demo.total})`}
          </span>
        )}
      </div>

      {messages.length > 0 && (
        <div className="mt-4 flex max-h-56 flex-col gap-2 overflow-y-auto" aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                m.from === 'owner'
                  ? 'self-end bg-navy text-white'
                  : m.status === 'error'
                    ? 'self-start bg-error-surface text-error'
                    : m.status === 'review'
                      ? 'self-start bg-review-surface text-review'
                      : 'self-start bg-white text-navy',
              )}
            >
              {m.text}
              {m.status === 'review' && (
                <>
                  {' '}
                  <a href={reviewHref} className="font-semibold underline underline-offset-4">
                    Open review queue
                  </a>
                </>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label htmlFor={UPDATE_INPUT_ID} className="sr-only">
          {locked ? 'Preloaded demo request' : 'Describe a change to your business information'}
        </label>
        <textarea
          id={UPDATE_INPUT_ID}
          rows={2}
          value={text}
          readOnly={locked}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={
            locked
              ? 'That was the last preloaded request. Open the review queue to see the audit trail.'
              : (example ?? 'Describe a change, for example a new price')
          }
          disabled={busy}
          className={cn(
            'max-h-40 min-h-[88px] flex-1 resize-y rounded-[10px] border border-border px-4 py-3 text-sm text-navy placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-action-blue',
            locked ? 'cursor-default bg-white/70' : 'bg-white',
          )}
        />
        <div className="flex gap-2 sm:flex-col">
          {!locked && example && (
            <button
              type="button"
              onClick={() => setTyped(example)}
              disabled={busy}
              className="min-h-[44px] flex-1 rounded-[10px] border border-border bg-white px-3 text-sm font-semibold text-navy hover:bg-white/60 disabled:opacity-50"
            >
              Use example
            </button>
          )}
          <Button
            id="onebridge-apply"
            onClick={send}
            disabled={busy || !text.trim()}
            className="min-h-[44px] flex-1 gap-2"
          >
            <Send size={16} aria-hidden="true" />
            {busy ? 'Applying...' : 'Apply update'}
          </Button>
        </div>
      </div>
    </section>
  )
}
