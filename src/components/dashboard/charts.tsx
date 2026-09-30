import { cn } from '@/lib/utils'

// Small dependency-free SVG charts. Each carries an aria-label summary so the
// numbers are available without seeing the graphic.

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-review-surface px-2 py-0.5 text-[11px] font-semibold text-review',
        className,
      )}
    >
      Sample data
    </span>
  )
}

export function Sparkline({
  values,
  color = '#408EEC',
  className,
}: {
  values: number[]
  color?: string
  className?: string
}) {
  if (values.length < 2) return null
  const w = 120
  const h = 36
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`)
    .join(' ')
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn('h-9 w-full', className)}
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

interface LineSeries {
  name: string
  color: string
  values: number[]
}

export function LineChart({
  series,
  labels,
  ariaLabel,
}: {
  series: LineSeries[]
  labels: string[]
  ariaLabel: string
}) {
  const W = 800
  const H = 220
  const pad = { l: 36, r: 8, t: 8, b: 24 }
  const n = labels.length
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const niceMax = Math.ceil(max / 20) * 20
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / niceMax) * (H - pad.t - pad.b)
  const ticks = [0, 0.5, 1].map((f) => Math.round(niceMax * f))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#DFE6EF" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#52627A">
            {t}
          </text>
        </g>
      ))}
      {[0, Math.floor(n / 2), n - 1].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 6}
          textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
          fontSize="11"
          fill="#52627A"
        >
          {labels[i]}
        </text>
      ))}
      {series.map((s) => (
        <polyline
          key={s.name}
          points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export function BarChart({
  values,
  labels,
  color = '#408EEC',
  ariaLabel,
}: {
  values: number[]
  labels: string[]
  color?: string
  ariaLabel: string
}) {
  const W = 800
  const H = 200
  const pad = { l: 8, r: 8, t: 8, b: 24 }
  const max = Math.max(1, ...values)
  const bw = (W - pad.l - pad.r) / values.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      {values.map((v, i) => {
        const h = (v / max) * (H - pad.t - pad.b)
        return (
          <rect
            key={i}
            x={pad.l + i * bw + 2}
            y={H - pad.b - h}
            width={Math.max(1, bw - 4)}
            height={h}
            rx="2"
            fill={color}
          />
        )
      })}
      {[0, Math.floor(values.length / 2), values.length - 1].map((i) => (
        <text
          key={i}
          x={i === 0 ? pad.l : i === values.length - 1 ? W - pad.r : pad.l + i * bw + bw / 2}
          y={H - 6}
          textAnchor={i === 0 ? 'start' : i === values.length - 1 ? 'end' : 'middle'}
          fontSize="11"
          fill="#52627A"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  )
}

export function Donut({
  segments,
  ariaLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  ariaLabel: string
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const r = 44
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label={ariaLabel}>
      <g transform="rotate(-90 60 60)">
        {segments.map((s) => {
          const len = (s.value / total) * c
          const el = (
            <circle
              key={s.label}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
      </g>
    </svg>
  )
}
