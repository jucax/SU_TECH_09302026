// Plain-language explanations for why a change was held, keyed by the rule id
// returned from lib/governance.ts. Shared by the dashboard notice and the
// review queue so an owner reads the same reason in both places.

export interface ReviewReason {
  label: string
  // Shown in the notification and the queue card.
  why: string
  // The owner's next step.
  action: string
}

const REASONS: Record<string, ReviewReason> = {
  price_delta_over_20pct: {
    label: 'Big price change',
    why: 'A big price change was flagged. Price moves of more than 20% can hurt customers if they are a typo, so OneBridge does not publish them on its own.',
    action: 'Please confirm it in the review queue.',
  },
  new_product: {
    label: 'New product',
    why: 'A new product was flagged. Adding an item changes what customers and AI assistants are told you sell, so it needs your approval first.',
    action: 'Please confirm it in the review queue.',
  },
}

const FALLBACK: ReviewReason = {
  label: 'Needs your review',
  why: 'This change was flagged for review before it goes live.',
  action: 'Please confirm it in the review queue.',
}

export function reviewReason(rule: string): ReviewReason {
  return REASONS[rule] ?? FALLBACK
}
