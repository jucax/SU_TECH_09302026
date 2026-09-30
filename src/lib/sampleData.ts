// Illustrative data for the demo dashboard ONLY. None of this is measured.
// Every screen that renders it must show a "Sample data" tag, and it is never
// shown for registered businesses (see isDemoTenant). Values are generated
// deterministically so the demo looks the same on every load.

export function isDemoTenant(slug: string | null): boolean {
  if (!slug) return false
  return slug === 'jorges-auto-parts' || slug.includes('-demo-')
}

function series(days: number, base: number, growth: number, wobble: number, seed: number) {
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  return Array.from({ length: days }, (_, i) =>
    Math.max(0, Math.round(base + i * growth + Math.sin(i / 2.3) * wobble + rand() * wobble)),
  )
}

export const SAMPLE_DAYS = 30

function dayLabels(days: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  return out
}

const visits = series(SAMPLE_DAYS, 62, 1.9, 9, 11)
const mcpCalls = series(SAMPLE_DAYS, 6, 0.85, 3, 29)
const salesDaily = series(SAMPLE_DAYS, 210, 6, 60, 47)
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

export const sample = {
  labels: dayLabels(SAMPLE_DAYS),
  visits,
  mcpCalls,
  salesDaily,
  totals: {
    visits: sum(visits),
    mcpCalls: sum(mcpCalls),
    salesDollars: sum(salesDaily),
    orders: Math.round(sum(salesDaily) / 58),
  },
  // Product KPIs named in the business plan. Targets are pilot goals, not results.
  kpis: {
    aiInclusionRate: { value: '68%', helper: 'Prompts where the business appeared', target: 'Pilot goal: track' },
    factualAccuracy: { value: '96%', helper: 'Claims matching approved data', target: 'Pilot goal: 95%+' },
    criticalMismatches: { value: '2.4%', helper: 'Price or availability wrong', target: 'Pilot goal: under 5%' },
    correctionRate: { value: '83%', helper: 'Issues fixed after review', target: 'Pilot goal: 80%+' },
    timeToResolution: { value: '1.6 days', helper: 'From detection to fix', target: 'Pilot goal: track' },
  },
  topQuestions: [
    { label: 'Is this part in stock?', count: 46 },
    { label: 'Does it fit my car?', count: 39 },
    { label: 'How much does it cost?', count: 33 },
    { label: 'What is the return policy?', count: 21 },
    { label: 'What are your hours?', count: 14 },
  ],
  trafficSplit: [
    { label: 'Website visits', value: sum(visits), color: '#F68835' },
    { label: 'MCP calls', value: sum(mcpCalls), color: '#408EEC' },
  ],
  accuracyTrend: [0.88, 0.9, 0.89, 0.93, 0.94, 0.95, 0.96],
  productInsights: [
    { name: 'Front Brake Rotor', asks: 58 },
    { name: 'Ceramic Brake Pads', asks: 41 },
    { name: 'Oil Filter', asks: 27 },
  ],
  team: [
    { name: 'Jorge Ramirez', role: 'Owner', access: 'Approves material changes' },
    { name: 'Maria Lopez', role: 'Store manager', access: 'Routine updates' },
  ],
  plan: { name: 'Pilot plan', price: '$149 / month', note: 'Illustrative price from the business plan' },
}
