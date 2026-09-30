import { getServiceClient } from './db.js'
import type { ChangeSet, ReviewQueueItem, VerifiedRecord } from './schemas.js'
import { applyChangeSet, type TenantRow } from './tenant.js'

// The ethics/governance component the case prompt requires: which changes
// apply automatically, which need a person, and who is accountable. Routing
// is deterministic code, never a model call: model output must not authorize
// writes or override deterministic rules. A model can explain a decision; it
// does not make one.

export type GovernanceRouting = 'auto_sync' | 'review'

export interface GovernanceDecision {
  routing: GovernanceRouting
  ruleTriggered: string
}

const MATERIAL_PRICE_DELTA_RATIO = 0.2 // 20%

// New products and large price moves need a person; everything else
// (availability toggles, small price edits, description/compatibility,
// hours, policies) auto-syncs. "Conflicting sources" is part of the product
// narrative but isn't checkable at this decision point in the PoC's scope --
// it would need an external signal this rule engine doesn't have, which is
// an honest scope boundary, not a gap to quietly close here.
export function evaluateChangeSet(
  changeSet: ChangeSet,
  currentRecord: VerifiedRecord,
): GovernanceDecision {
  if (changeSet.productsCreate?.length) {
    return { routing: 'review', ruleTriggered: 'new_product' }
  }

  if (changeSet.productsUpdate?.length) {
    for (const update of changeSet.productsUpdate) {
      if (update.priceCents === undefined) continue
      const current = currentRecord.products.find((p) => p.id === update.id)
      if (!current || current.priceCents === 0) continue
      const delta = Math.abs(update.priceCents - current.priceCents) / current.priceCents
      if (delta > MATERIAL_PRICE_DELTA_RATIO) {
        return { routing: 'review', ruleTriggered: 'price_delta_over_20pct' }
      }
    }
  }

  return { routing: 'auto_sync', ruleTriggered: 'routine' }
}

interface ReviewQueueRow {
  id: string
  tenant_id: string
  summary: string
  raw_instruction: string | null
  change_set: ChangeSet
  rule_triggered: string
  status: 'pending' | 'approved' | 'rejected'
  decided_by: string | null
  decided_at: string | null
  created_at: string
}

function mapReviewRow(row: ReviewQueueRow): ReviewQueueItem {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    summary: row.summary,
    rawInstruction: row.raw_instruction,
    changeSet: row.change_set,
    ruleTriggered: row.rule_triggered,
    status: row.status,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  }
}

export async function queueForReview(
  tenant: TenantRow,
  changeSet: ChangeSet,
  summary: string,
  ruleTriggered: string,
  rawInstruction?: string,
): Promise<ReviewQueueItem> {
  const { data, error } = await getServiceClient()
    .from('review_queue')
    .insert({
      tenant_id: tenant.id,
      summary,
      raw_instruction: rawInstruction ?? null,
      change_set: changeSet,
      rule_triggered: ruleTriggered,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapReviewRow(data)
}

export async function listReviewQueue(tenant: TenantRow): Promise<ReviewQueueItem[]> {
  const { data, error } = await getServiceClient()
    .from('review_queue')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapReviewRow)
}

// Approving applies the queued change set through the exact same
// applyChangeSet path M7's auto-sync uses (source 'review_approval' instead
// of 'owner_edit'), so there is one write path, not two. Rejecting just
// closes the item out. Either way, who decided and when is recorded --
// that's the accountability half of the governance requirement.
export async function decideReviewItem(
  tenant: TenantRow,
  reviewId: string,
  decision: 'approve' | 'reject',
  decidedBy: string,
): Promise<void> {
  const client = getServiceClient()
  const { data, error } = await client
    .from('review_queue')
    .select('*')
    .eq('id', reviewId)
    .eq('tenant_id', tenant.id)
    .single()
  if (error) throw error

  const item = mapReviewRow(data)
  if (item.status !== 'pending') {
    throw new Error('This item has already been decided.')
  }

  if (decision === 'approve') {
    await applyChangeSet(tenant, item.changeSet, item.summary, 'review_approval', {
      rawInstruction: item.rawInstruction ?? undefined,
      approvedBy: decidedBy,
    })
  }

  const { error: updateError } = await client
    .from('review_queue')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
  if (updateError) throw updateError
}
