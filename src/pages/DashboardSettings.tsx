import { useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Bell,
  Building2,
  Check,
  Clock,
  CreditCard,
  FileText,
  Pencil,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { SampleBadge } from '@/components/dashboard/charts'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useTenantData } from '@/components/dashboard/useTenantData'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { isDemoTenant, sample } from '@/lib/sampleData'
import { formatDayOfWeek, formatHoursEntry } from '@lib/format'
import type { ChangeSet, HoursEntry, Policy } from '@lib/schemas'

const fieldClass =
  'min-h-[40px] rounded-[10px] border border-border bg-white px-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-action-blue'

// Card with a header Edit button. `view` shows the saved values, `edit` shows
// the form. Saving is async so real sections can call the API.
function EditableCard({
  icon,
  title,
  sampleTag,
  note,
  view,
  edit,
  onSave,
  onOpen,
}: {
  icon: ReactNode
  title: string
  sampleTag?: boolean
  note?: string
  view: ReactNode
  edit: ReactNode
  onSave: () => Promise<string | null>
  onOpen?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setError(null)
    const err = await onSave()
    setSaving(false)
    if (err) {
      setError(err)
      return
    }
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <span className="text-action-blue">{icon}</span>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {sampleTag && <SampleBadge />}
          {saved && (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-xs font-semibold text-success"
            >
              <Check size={14} aria-hidden="true" /> Saved
            </span>
          )}
          {!editing && (
            <button
              type="button"
              onClick={() => {
                onOpen?.()
                setEditing(true)
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-border bg-white px-3 text-sm font-semibold text-navy hover:bg-subtle-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
            >
              <Pencil size={14} aria-hidden="true" /> Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <>
          {edit}
          {note && <p className="text-xs text-secondary">{note}</p>}
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="min-h-[40px]">
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setError(null)
              }}
              disabled={saving}
              className="min-h-[40px] rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-navy hover:bg-gray"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        view
      )}
    </Card>
  )
}

function Toggle({ label, helper, defaultOn }: { label: string; helper: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-secondary">{helper}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn(!on)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2',
          on ? 'bg-action-blue' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            on && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}

type SubscriptionStatus = 'active' | 'confirming-cancel' | 'canceled'

// OneBridge has exactly one plan (src/pages/Landing.tsx's #pricing section):
// a $250 one-time setup fee and a flat $149/month. There is no tier picker
// here because there is nothing to pick between -- this card only ever shows
// that one plan, plus the real cancel/reactivate state machine below it.
function PlanCard({ sampleTag }: { sampleTag?: boolean }) {
  const [status, setStatus] = useState<SubscriptionStatus>('active')

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <span className="text-action-blue">
            <CreditCard size={18} aria-hidden="true" />
          </span>
          Plan
        </h2>
        {sampleTag && <SampleBadge />}
      </div>

      {status === 'active' && (
        <>
          <div>
            <p className="text-2xl font-extrabold text-navy">{sample.plan.price}</p>
            <p className="text-sm font-semibold text-navy">{sample.plan.name}</p>
            <p className="text-xs text-secondary">
              Plus a {sample.plan.setupFee} one-time setup fee, already paid. No other plan or
              tier: this is the only subscription OneBridge offers.
            </p>
          </div>
          <p className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-success">
            <Check size={14} aria-hidden="true" /> Active
          </p>
          <button
            type="button"
            onClick={() => setStatus('confirming-cancel')}
            className="inline-flex w-fit min-h-[40px] items-center gap-1.5 rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-error hover:bg-error-surface"
          >
            Cancel subscription
          </button>
          <p className="text-xs text-secondary">Demo: no billing is connected. Nothing is charged here.</p>
        </>
      )}

      {status === 'confirming-cancel' && (
        <>
          <div className="flex flex-col gap-2 rounded-lg border border-error-surface bg-error-surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-error">
              <AlertTriangle size={16} aria-hidden="true" /> Cancel your subscription?
            </p>
            <p className="text-sm text-navy">
              Your website, MCP server, and dashboard stop updating for customers and AI
              assistants once this takes effect. You can reactivate any time.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('canceled')}
              className="min-h-[40px] rounded-[10px] bg-error px-4 text-sm font-semibold text-white hover:bg-error/90"
            >
              Yes, cancel subscription
            </button>
            <button
              type="button"
              onClick={() => setStatus('active')}
              className="min-h-[40px] rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-navy hover:bg-gray"
            >
              Keep my subscription
            </button>
          </div>
        </>
      )}

      {status === 'canceled' && (
        <>
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-gray p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
              <Check size={16} aria-hidden="true" /> Subscription canceled
            </p>
            <p className="text-sm text-secondary">
              {sample.plan.name} ({sample.plan.price}) is no longer active.
            </p>
          </div>
          <Button onClick={() => setStatus('active')} className="w-fit">
            Reactivate subscription
          </Button>
        </>
      )}
    </Card>
  )
}

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '')
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function DashboardSettings() {
  const { slug, record, activity, error, reload } = useTenantData()
  const demo = isDemoTenant(slug)

  // Local (sample or not yet backed by the API) values.
  const [nameOverride, setNameOverride] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [team, setTeam] = useState(sample.team)
  const [teamDraft, setTeamDraft] = useState(sample.team)

  // Real, saved through /api/apply-change.
  const [hoursDraft, setHoursDraft] = useState<HoursEntry[]>([])
  const [policyDraft, setPolicyDraft] = useState<Policy[]>([])

  async function applyChange(changeSet: ChangeSet, summary: string): Promise<string | null> {
    if (!slug) return 'No business loaded.'
    try {
      const res = await fetch('/api/apply-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, changeSet, summary, instruction: summary }),
      })
      const body = await res.json()
      if (!res.ok) return body.error ?? 'Could not save that change'
      reload()
      return null
    } catch {
      return 'Could not save that change'
    }
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

  const displayName = nameOverride ?? record?.profile.name ?? '...'
  const sortedHours = [...(record?.hours ?? [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  )

  return (
    <DashboardLayout
      slug={slug}
      businessName={displayName}
      logoUrl={record?.profile.logoUrl}
      pendingReview={activity?.reviewCounts.pending ?? 0}
    >
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-navy md:text-[28px]">Settings</h1>
          <p className="text-sm text-secondary">
            Business profile, hours, policies and how OneBridge handles changes.
          </p>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <EditableCard
            icon={<Building2 size={18} aria-hidden="true" />}
            title="Business profile"
            note="Demo: the display name changes here only. Your published site keeps the approved name."
            onOpen={() => setNameDraft(displayName === '...' ? '' : displayName)}
            onSave={async () => {
              if (!nameDraft.trim()) return 'Enter a business name.'
              setNameOverride(nameDraft.trim())
              return null
            }}
            view={
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs text-secondary">Business name</dt>
                  <dd className="font-semibold text-navy">{displayName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-secondary">Website address</dt>
                  <dd className="break-all font-semibold text-navy">/site/{slug}</dd>
                </div>
                <div>
                  <dt className="text-xs text-secondary">MCP endpoint</dt>
                  <dd className="break-all font-semibold text-navy">
                    {window.location.origin}/site/{slug}/mcp
                  </dd>
                </div>
              </dl>
            }
            edit={
              <label className="grid gap-1 text-sm">
                <span className="text-xs text-secondary">Business name</span>
                <input
                  className={fieldClass}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
              </label>
            }
          />

          <EditableCard
            icon={<Clock size={18} aria-hidden="true" />}
            title="Business hours"
            onOpen={() =>
              setHoursDraft(
                DAY_ORDER.map(
                  (d) =>
                    record?.hours.find((h) => h.dayOfWeek === d) ?? {
                      dayOfWeek: d,
                      opensAt: null,
                      closesAt: null,
                      closed: true,
                    },
                ),
              )
            }
            onSave={() => {
              for (const h of hoursDraft) {
                if (!h.closed && (!h.opensAt || !h.closesAt)) {
                  return Promise.resolve(`Set opening and closing times for ${formatDayOfWeek(h.dayOfWeek)}.`)
                }
              }
              const cleaned = hoursDraft.map((h) => ({
                ...h,
                opensAt: h.closed ? null : hhmm(h.opensAt),
                closesAt: h.closed ? null : hhmm(h.closesAt),
              }))
              return applyChange({ hours: cleaned }, 'Updated business hours')
            }}
            view={
              <ul className="grid gap-1 text-sm">
                {sortedHours.map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between gap-4">
                    <span className="text-navy">{formatDayOfWeek(h.dayOfWeek)}</span>
                    <span className="text-secondary">{formatHoursEntry(h)}</span>
                  </li>
                ))}
                {!record && <li className="text-secondary">Loading...</li>}
              </ul>
            }
            edit={
              <ul className="grid gap-2 text-sm">
                {hoursDraft.map((h, i) => (
                  <li key={h.dayOfWeek} className="flex flex-wrap items-center gap-2">
                    <span className="w-24 text-navy">{formatDayOfWeek(h.dayOfWeek)}</span>
                    <input
                      type="time"
                      aria-label={`${formatDayOfWeek(h.dayOfWeek)} opens`}
                      disabled={h.closed}
                      value={hhmm(h.opensAt)}
                      onChange={(e) =>
                        setHoursDraft((d) =>
                          d.map((x, j) => (j === i ? { ...x, opensAt: e.target.value } : x)),
                        )
                      }
                      className={cn(fieldClass, 'w-28 disabled:opacity-40')}
                    />
                    <span className="text-secondary">to</span>
                    <input
                      type="time"
                      aria-label={`${formatDayOfWeek(h.dayOfWeek)} closes`}
                      disabled={h.closed}
                      value={hhmm(h.closesAt)}
                      onChange={(e) =>
                        setHoursDraft((d) =>
                          d.map((x, j) => (j === i ? { ...x, closesAt: e.target.value } : x)),
                        )
                      }
                      className={cn(fieldClass, 'w-28 disabled:opacity-40')}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-secondary">
                      <input
                        type="checkbox"
                        checked={h.closed}
                        onChange={(e) =>
                          setHoursDraft((d) =>
                            d.map((x, j) => (j === i ? { ...x, closed: e.target.checked } : x)),
                          )
                        }
                      />
                      Closed
                    </label>
                  </li>
                ))}
              </ul>
            }
          />

          <EditableCard
            icon={<FileText size={18} aria-hidden="true" />}
            title="Policies"
            onOpen={() => setPolicyDraft((record?.policies ?? []).map((p) => ({ ...p })))}
            onSave={() => {
              if (policyDraft.some((p) => !p.body.trim())) {
                return Promise.resolve('A policy cannot be empty.')
              }
              return applyChange({ policies: policyDraft }, 'Updated store policies')
            }}
            view={
              <ul className="flex flex-col gap-3">
                {(record?.policies ?? []).map((p) => (
                  <li key={p.kind}>
                    <p className="text-sm font-semibold capitalize text-navy">{p.kind}</p>
                    <p className="text-sm text-secondary">{p.body}</p>
                  </li>
                ))}
                {record && record.policies.length === 0 && (
                  <li className="text-sm text-secondary">No policies published</li>
                )}
              </ul>
            }
            edit={
              <ul className="flex flex-col gap-3">
                {policyDraft.map((p, i) => (
                  <li key={p.kind} className="grid gap-1">
                    <label
                      htmlFor={`policy-${p.kind}`}
                      className="text-sm font-semibold capitalize text-navy"
                    >
                      {p.kind}
                    </label>
                    <textarea
                      id={`policy-${p.kind}`}
                      rows={2}
                      value={p.body}
                      onChange={(e) =>
                        setPolicyDraft((d) =>
                          d.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)),
                        )
                      }
                      className={cn(fieldClass, 'py-2')}
                    />
                  </li>
                ))}
                {policyDraft.length === 0 && (
                  <li className="text-sm text-secondary">No policies to edit yet.</li>
                )}
              </ul>
            }
          />

          <Card className="flex flex-col gap-4 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <span className="text-action-blue">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              Change approval rules
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-secondary">
              <li>
                <span className="font-semibold text-success">Applied automatically:</span> small
                price edits, availability, hours, policies, descriptions.
              </li>
              <li>
                <span className="font-semibold text-review">Held for your review:</span> new
                products and price changes over 20%.
              </li>
              <li>Every decision is recorded in the audit trail.</li>
            </ul>
            <p className="text-xs text-secondary">
              These rules are set by OneBridge in this prototype and are not editable yet.
            </p>
          </Card>

          {demo && (
            <>
              <EditableCard
                icon={<Users size={18} aria-hidden="true" />}
                title="Team"
                sampleTag
                note="Demo: team changes stay in this browser tab."
                onOpen={() => setTeamDraft(team.map((m) => ({ ...m })))}
                onSave={async () => {
                  if (teamDraft.some((m) => !m.name.trim())) return 'Every member needs a name.'
                  setTeam(teamDraft)
                  return null
                }}
                view={
                  <ul className="flex flex-col divide-y divide-border">
                    {team.map((m) => (
                      <li key={m.name} className="flex items-center gap-3 py-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-subtle-blue text-sm font-bold text-action-blue">
                          {m.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-navy">
                            {m.name} <span className="font-normal text-secondary">({m.role})</span>
                          </p>
                          <p className="text-xs text-secondary">{m.access}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                }
                edit={
                  <div className="grid gap-2">
                    {teamDraft.map((m, i) => (
                      <div key={i} className="flex flex-wrap gap-2">
                        <input
                          aria-label="Name"
                          className={cn(fieldClass, 'min-w-0 flex-1')}
                          value={m.name}
                          onChange={(e) =>
                            setTeamDraft((d) =>
                              d.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                            )
                          }
                        />
                        <input
                          aria-label="Role"
                          className={cn(fieldClass, 'w-36')}
                          value={m.role}
                          onChange={(e) =>
                            setTeamDraft((d) =>
                              d.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)),
                            )
                          }
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setTeamDraft((d) => [
                          ...d,
                          { name: 'New member', role: 'Staff', access: 'Routine updates' },
                        ])
                      }
                      className="w-fit text-sm font-semibold text-action-blue underline underline-offset-4"
                    >
                      Add a member
                    </button>
                  </div>
                }
              />

              <Card className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-base font-bold text-navy">
                    <span className="text-action-blue">
                      <Bell size={18} aria-hidden="true" />
                    </span>
                    Notifications
                  </h2>
                  <SampleBadge />
                </div>
                <Toggle
                  label="Email me when a change needs review"
                  helper="Demo: not saved"
                  defaultOn
                />
                <Toggle label="Weekly accuracy summary" helper="Demo: not saved" defaultOn />
                <Toggle
                  label="Alert me about AI answers that disagree with my data"
                  helper="Demo: not saved"
                  defaultOn={false}
                />
              </Card>

              <PlanCard sampleTag />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
