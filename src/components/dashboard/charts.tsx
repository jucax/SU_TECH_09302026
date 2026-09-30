import { useId } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

const AXIS = { fontSize: 11, fill: '#52627A' }
const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #DFE6EF',
  boxShadow: '0 4px 18px rgba(9,29,63,0.08)',
  fontSize: 12,
}

// One metric over time as a soft gradient area. Used for visits and MCP calls
// as two separate charts so each keeps its own scale.
export function AreaTrend({
  values,
  labels,
  color,
  name,
  height = 200,
  ariaLabel,
}: {
  values: number[]
  labels: string[]
  color: string
  name: string
  height?: number
  ariaLabel: string
}) {
  const gid = useId().replace(/:/g, '')
  const data = values.map((v, i) => ({ label: labels[i], value: v }))
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#DFE6EF" />
          <XAxis
            dataKey="label"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, name]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gid})`}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SalesBars({
  values,
  labels,
  ariaLabel,
}: {
  values: number[]
  labels: string[]
  ariaLabel: string
}) {
  const data = values.map((v, i) => ({ label: labels[i], value: v }))
  return (
    <div role="img" aria-label={ariaLabel} className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#DFE6EF" />
          <XAxis
            dataKey="label"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(64,142,236,0.08)' }}
            formatter={(v) => [`$${v}`, 'Sales']}
          />
          <Bar dataKey="value" fill="#166534" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </RBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Donut({
  segments,
  ariaLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  ariaLabel: string
}) {
  return (
    <div role="img" aria-label={ariaLabel} className="h-40 w-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={3}
            stroke="none"
            isAnimationActive={false}
          >
            {segments.map((s) => (
              <Cell key={s.label} fill={s.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
