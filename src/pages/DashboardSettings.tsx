import { useState } from 'react'
import { Bell, Building2, Clock, CreditCard, FileText, ShieldCheck, Users } from 'lucide-react'

import { SampleBadge } from '@/components/dashboard/charts'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useTenantData } from '@/components/dashboard/useTenantData'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { isDemoTenant, sample } from '@/lib/sampleData'
import { formatDayOfWeek, formatHoursEntry } from '@lib/format'

function Section({
  icon,
  title,
  sampleTag,
  children,
}: {
  icon: React.ReactNode
  title: string
  sampleTag?: boolean
  children: React.ReactNode
}) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <span className="text-action-blue">{icon}</span>
          {title}
        </h2>
        {sampleTag && <SampleBadge />}
      </div>
      {children}
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

export function DashboardSettings() {
  const { slug, record, activity, error } = useTenantData()
  const demo = isDemoTenant(slug)

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

  return (
    <DashboardLayout
      slug={slug}
      businessName={record?.profile.name}
      pendingReview={activity?.reviewCounts.pending ?? 0}
    >
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-navy md:text-[28px]">Settings</h1>
          <p className="text-sm text-secondary">
            Business profile, hours, policies and how OneBridge handles changes.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section icon={<Building2 size={18} aria-hidden="true" />} title="Business profile">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-secondary">Business name</dt>
                <dd className="font-semibold text-navy">{record?.profile.name ?? '...'}</dd>
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
          </Section>

          <Section icon={<Clock size={18} aria-hidden="true" />} title="Business hours">
            <ul className="grid gap-1 text-sm">
              {[...(record?.hours ?? [])]
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between gap-4">
                    <span className="text-navy">{formatDayOfWeek(h.dayOfWeek)}</span>
                    <span className="text-secondary">{formatHoursEntry(h)}</span>
                  </li>
                ))}
              {!record && <li className="text-secondary">Loading...</li>}
            </ul>
          </Section>

          <Section icon={<FileText size={18} aria-hidden="true" />} title="Policies">
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
          </Section>

          <Section icon={<ShieldCheck size={18} aria-hidden="true" />} title="Change approval rules">
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
          </Section>

          {demo && (
            <>
              <Section icon={<Users size={18} aria-hidden="true" />} title="Team" sampleTag>
                <ul className="flex flex-col divide-y divide-border">
                  {sample.team.map((m) => (
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
              </Section>

              <Section icon={<Bell size={18} aria-hidden="true" />} title="Notifications" sampleTag>
                <Toggle
                  label="Email me when a change needs review"
                  helper="Preview only, not saved"
                  defaultOn
                />
                <Toggle
                  label="Weekly accuracy summary"
                  helper="Preview only, not saved"
                  defaultOn
                />
                <Toggle
                  label="Alert me about AI answers that disagree with my data"
                  helper="Preview only, not saved"
                  defaultOn={false}
                />
              </Section>

              <Section icon={<CreditCard size={18} aria-hidden="true" />} title="Plan" sampleTag>
                <p className="text-2xl font-extrabold text-navy">{sample.plan.price}</p>
                <p className="text-sm font-semibold text-navy">{sample.plan.name}</p>
                <p className="text-xs text-secondary">{sample.plan.note}. No billing is connected.</p>
              </Section>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
