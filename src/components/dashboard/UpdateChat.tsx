import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EditTarget, UpdatePhase } from './FrontDoorPreviews'

export interface UpdateOutcome {
  status: 'applied' | 'review' | 'error'
  message: string
}

interface ChatMessage {
  from: 'owner' | 'ai'
  text: string
  status?: UpdateOutcome['status']
}

interface UpdateChatProps {
  target: EditTarget
  onTargetChange: (target: EditTarget) => void
  phase: UpdatePhase
  example: string | null
  reviewHref: string
  onSubmit: (instruction: string) => Promise<UpdateOutcome>
}

const TARGETS: Array<{ id: EditTarget; label: string }> = [
  { id: 'website', label: 'Website' },
  { id: 'mcp', label: 'MCP' },
]

export const UPDATE_INPUT_ID = 'onebridge-update-input'

export function UpdateChat({
  target,
  onTargetChange,
  phase,
  example,
  reviewHref,
  onSubmit,
}: UpdateChatProps) {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const busy = phase !== 'idle' && phase !== 'done'

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [messages.length])

  async function send() {
    const instruction = text.trim()
    if (!instruction || busy) return
    setMessages((m) => [...m, { from: 'owner', text: instruction }])
    setText('')
    const outcome = await onSubmit(instruction)
    // Failed updates give the owner their text back so they can retry.
    if (outcome.status === 'error') setText(instruction)
    setMessages((m) => [...m, { from: 'ai', text: outcome.message, status: outcome.status }])
  }

  return (
    <section
      aria-labelledby="update-heading"
      className="rounded-card border border-border border-l-4 border-l-action-blue bg-subtle-blue p-5 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="update-heading" className="flex items-center gap-2 text-lg font-bold text-navy">
            <Sparkles size={20} aria-hidden="true" className="text-action-blue" />
            Update with OneBridge AI
          </h2>
          <p className="text-sm text-secondary">
            Update once. Keep both front doors aligned. Routine updates apply; material changes go
            to review.
          </p>
        </div>

        <div role="group" aria-label="Edit focus" className="flex rounded-full bg-white p-1">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={target === t.id}
              onClick={() => onTargetChange(t.id)}
              className={cn(
                'min-h-[36px] rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue',
                target === t.id ? 'bg-navy text-white' : 'text-secondary hover:text-navy',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
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
          Describe a change to your business information
        </label>
        <textarea
          id={UPDATE_INPUT_ID}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={example ?? 'Describe a change, for example a new price'}
          disabled={busy}
          className="max-h-40 min-h-[88px] flex-1 resize-y rounded-[10px] border border-border bg-white px-4 py-3 text-sm text-navy placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-action-blue"
        />
        <div className="flex gap-2 sm:flex-col">
          {example && (
            <button
              type="button"
              onClick={() => setText(example)}
              disabled={busy}
              className="min-h-[44px] flex-1 rounded-[10px] border border-border bg-white px-3 text-sm font-semibold text-navy hover:bg-white/60 disabled:opacity-50"
            >
              Use example
            </button>
          )}
          <Button
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
