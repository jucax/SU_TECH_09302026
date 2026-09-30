import type { ExtractedClaim } from './ai/extractClaims.js'
import { formatPriceCents } from './format.js'
import type { VerifiedRecord } from './schemas.js'

// Compares extracted claims against a tenant's actual verified record.
// Deliberately conservative: a claim only counts as a match when it can be
// checked against a specific field, and anything we can't confidently check
// is 'unverifiable' rather than guessed into a match or a mismatch. See
// docs/PLAN.md "Comparison fairness" and the gap review's "denominator" note.

export type ClaimStatus = 'match' | 'mismatch' | 'unverifiable'

export interface ClaimDiffEntry extends ExtractedClaim {
  actualValue: string | null
  status: ClaimStatus
}

export interface ClaimDiffResult {
  entries: ClaimDiffEntry[]
  matches: number
  mismatches: number
  unverifiable: number
  // matches / (matches + mismatches). A pure abstention (no claims asserted)
  // has an empty denominator and scores 1: it made zero false claims, even
  // though it also made zero useful ones -- the evidence table, not this
  // single number, is what actually shows that distinction.
  accuracyScore: number
}

function findProduct(record: VerifiedRecord, subject: string) {
  const needle = subject.toLowerCase()
  return record.products.find(
    (p) => p.name.toLowerCase().includes(needle) || needle.includes(p.name.toLowerCase()),
  )
}

function extractNumber(text: string): number | null {
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  return match ? Number(match[0]) : null
}

function extractAvailability(text: string): boolean | null {
  const t = text.toLowerCase()
  const negative = /(out of stock|unavailable|sold out|not in stock|not available|no longer)/.test(t)
  if (negative) return false
  const positive = /(in stock|available|yes)/.test(t)
  if (positive) return true
  return null
}

function diffOne(claim: ExtractedClaim, record: VerifiedRecord): ClaimDiffEntry {
  if (claim.field === 'price') {
    const product = findProduct(record, claim.subject)
    if (!product) return { ...claim, actualValue: null, status: 'unverifiable' }
    const claimedNumber = extractNumber(claim.claimedValue)
    const actualDollars = product.priceCents / 100
    const actualValue = formatPriceCents(product.priceCents, product.currency)
    const status: ClaimStatus =
      claimedNumber !== null && Math.abs(claimedNumber - actualDollars) < 0.01 ? 'match' : 'mismatch'
    return { ...claim, actualValue, status }
  }

  if (claim.field === 'availability') {
    const product = findProduct(record, claim.subject)
    if (!product) return { ...claim, actualValue: null, status: 'unverifiable' }
    const actualValue = product.available ? 'In stock' : 'Unavailable'
    const claimedAvailable = extractAvailability(claim.claimedValue)
    if (claimedAvailable === null) return { ...claim, actualValue, status: 'unverifiable' }
    return { ...claim, actualValue, status: claimedAvailable === product.available ? 'match' : 'mismatch' }
  }

  if (claim.field === 'compatibility') {
    const product = findProduct(record, claim.subject)
    if (!product?.compatibility) return { ...claim, actualValue: product?.compatibility ?? null, status: 'unverifiable' }
    const a = claim.claimedValue.toLowerCase()
    const b = product.compatibility.toLowerCase()
    const status: ClaimStatus = a.includes(b) || b.includes(a) ? 'match' : 'mismatch'
    return { ...claim, actualValue: product.compatibility, status }
  }

  if (claim.field === 'policy') {
    const policy = record.policies.find(
      (p) =>
        p.kind.toLowerCase() === claim.subject.toLowerCase() ||
        claim.subject.toLowerCase().includes(p.kind.toLowerCase()),
    )
    if (!policy) return { ...claim, actualValue: null, status: 'unverifiable' }
    // Loose containment check on policy text; free-form prose isn't worth a
    // stricter comparison for this PoC, so anything not a clear substring
    // match is left unverifiable rather than called a mismatch.
    const status: ClaimStatus = policy.body
      .toLowerCase()
      .includes(claim.claimedValue.toLowerCase().slice(0, 30))
      ? 'match'
      : 'unverifiable'
    return { ...claim, actualValue: policy.body, status }
  }

  // 'hours' and 'other': not compared for this PoC's fixed field set.
  return { ...claim, actualValue: null, status: 'unverifiable' }
}

export function diffClaims(claims: ExtractedClaim[], record: VerifiedRecord): ClaimDiffResult {
  const entries = claims.map((claim) => diffOne(claim, record))
  const matches = entries.filter((e) => e.status === 'match').length
  const mismatches = entries.filter((e) => e.status === 'mismatch').length
  const unverifiable = entries.filter((e) => e.status === 'unverifiable').length
  const denominator = matches + mismatches
  const accuracyScore = denominator > 0 ? matches / denominator : 1

  return { entries, matches, mismatches, unverifiable, accuracyScore }
}
