import { getServiceClient } from './db.js'
import type { ActivitySummary } from './schemas.js'
import type { TenantRow } from './tenant.js'

// Real, queryable activity for one tenant: MCP traffic, how recently the
// record was actually touched, what's been applied and by what path, and the
// accuracy trend from monitoring runs. Deliberately does not report an
// "inconsistencies resolved" count: nothing here links a detected mismatch to
// a specific fix, so a resolved-count would be invented, not measured. The
// detect, fix, recheck story is told by the timeline of real events below,
// not by a synthetic aggregate.

interface StoredDiffResult {
  mismatches: number
}
interface StoredMonitorDiff {
  withMcp: StoredDiffResult
}

export async function getActivitySummary(tenant: TenantRow): Promise<ActivitySummary> {
  const client = getServiceClient()

  const [mcpLogRes, updatesRes, reviewRes, monitorRes] = await Promise.all([
    client.from('mcp_requests_log').select('tool_name').eq('tenant_id', tenant.id),
    client
      .from('updates_log')
      .select('source, created_at')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false }),
    client.from('review_queue').select('status').eq('tenant_id', tenant.id),
    client
      .from('monitor_runs')
      .select('created_at, accuracy_score, diff')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true }),
  ])

  if (mcpLogRes.error) throw mcpLogRes.error
  if (updatesRes.error) throw updatesRes.error
  if (reviewRes.error) throw reviewRes.error
  if (monitorRes.error) throw monitorRes.error

  const mcpRequestsByTool: Record<string, number> = {}
  for (const row of mcpLogRes.data) {
    mcpRequestsByTool[row.tool_name] = (mcpRequestsByTool[row.tool_name] ?? 0) + 1
  }

  const updatesBySource: Record<string, number> = {}
  for (const row of updatesRes.data) {
    updatesBySource[row.source] = (updatesBySource[row.source] ?? 0) + 1
  }

  const reviewCounts = { pending: 0, approved: 0, rejected: 0 }
  for (const row of reviewRes.data) {
    if (row.status === 'pending') reviewCounts.pending++
    else if (row.status === 'approved') reviewCounts.approved++
    else if (row.status === 'rejected') reviewCounts.rejected++
  }

  const accuracyTrend: ActivitySummary['accuracyTrend'] = monitorRes.data.map((row) => ({
    createdAt: row.created_at,
    accuracyScore: row.accuracy_score,
  }))

  const latestRun = monitorRes.data.at(-1)
  const latestDiff = latestRun?.diff as StoredMonitorDiff | undefined

  return {
    mcpRequestCount: mcpLogRes.data.length,
    mcpRequestsByTool,
    lastUpdatedAt: updatesRes.data[0]?.created_at ?? tenant.createdAt,
    updatesApplied: updatesRes.data.length,
    updatesBySource,
    reviewCounts,
    monitorRunCount: monitorRes.data.length,
    latestAccuracyScore: latestRun?.accuracy_score ?? null,
    latestMismatches: latestDiff?.withMcp.mismatches ?? null,
    accuracyTrend,
  }
}
