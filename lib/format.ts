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

export function formatTime(time: string | null): string {
  if (!time) return ''
  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minuteStr} ${period}`
}

export function formatHoursEntry(entry: {
  closed: boolean
  opensAt: string | null
  closesAt: string | null
}): string {
  if (entry.closed) return 'Closed'
  return `${formatTime(entry.opensAt)} to ${formatTime(entry.closesAt)}`
}
