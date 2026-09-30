// Pure formatting helpers, no secrets. Shared by the client dashboard (M4),
// the generated business site (M5), and the monitoring diff display (M8).

export function formatPriceCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export function formatDayOfWeek(day: number): string {
  return DAY_NAMES[day] ?? 'Unknown'
}

function formatTime(time: string | null): string {
  if (!time) return ''
  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minuteStr} ${period}`
}

// Used by lib/generate/site.ts before interpolating owner-supplied text into
// HTML. Business names, product descriptions, and policy text all eventually
// come from an owner (directly, or via the AI structuring step), so none of
// it can be trusted as safe markup.
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

export function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  if (diffSeconds < 60) return 'just now'
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export function formatHoursEntry(entry: {
  closed: boolean
  opensAt: string | null
  closesAt: string | null
}): string {
  if (entry.closed) return 'Closed'
  return `${formatTime(entry.opensAt)} to ${formatTime(entry.closesAt)}`
}
