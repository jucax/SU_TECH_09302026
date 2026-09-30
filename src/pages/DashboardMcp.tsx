import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { McpInspector } from '@/components/dashboard/McpInspector'
import { useTenantData } from '@/components/dashboard/useTenantData'

export function DashboardMcp() {
  const { slug, record, activity, error } = useTenantData()
  const navigate = useNavigate()
  return <DashboardLayout slug={slug} businessName={record?.profile.name} logoUrl={record?.profile.logoUrl} pendingReview={activity?.reviewCounts.pending ?? 0}>
    <h1 className="sr-only">AI connection</h1>
    {!slug || error ? <div role="status" className="rounded-card border border-border bg-white p-6"><h2 className="font-bold">{error ? 'Could not load this business' : 'No business loaded'}</h2><p className="mt-2 text-sm text-secondary">{error ?? 'Start a demo to explore its AI connection.'}</p><button className="mt-4 text-sm font-semibold text-action-blue" onClick={() => navigate('/demo')}>Open demo</button></div>
      : !record ? <div role="status" className="rounded-card border border-border bg-white p-6">Loading approved business information…</div>
      : <McpInspector embedded record={record} phase="idle" onClose={() => {}} onUpdate={() => navigate(`/dashboard?slug=${encodeURIComponent(record.profile.slug)}&update=1`)} />}
  </DashboardLayout>
}
