import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Server,
  type LucideIcon,
} from 'lucide-react'

import { forgetTenant } from '@/lib/tenantSession'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: LucideIcon
  to: string
  end?: boolean
}

function navItems(slug: string | null): NavItem[] {
  const q = slug ? `?slug=${encodeURIComponent(slug)}` : ''
  return [
    { label: 'Dashboard', icon: LayoutDashboard, to: `/dashboard${q}`, end: true },
    { label: 'Products', icon: Package, to: `/dashboard/products${q}` },
    { label: 'AI connection', icon: Server, to: `/dashboard/mcp${q}` },
    { label: 'Analytics', icon: Activity, to: `/dashboard/analytics${q}` },
    { label: 'Test', icon: FlaskConical, to: `/dashboard/test${q}` },
    { label: 'Review queue', icon: ClipboardCheck, to: `/dashboard/review${q}` },
    { label: 'Settings', icon: Settings, to: `/dashboard/settings${q}` },
  ]
}

const itemBase =
  'flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-[10px] px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2'

function NavEntry({ item, pendingReview }: { item: NavItem; pendingReview: number }) {
  const Icon = item.icon
  const badge =
    item.label === 'Review queue' && pendingReview > 0 ? (
      <span className="ml-auto rounded-full bg-review-surface px-2 text-xs text-review">
        {pendingReview}
      </span>
    ) : null

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          itemBase,
          'border-l-[3px]',
          isActive
            ? 'border-action-blue bg-subtle-blue text-navy'
            : 'border-transparent text-secondary hover:bg-subtle-blue hover:text-navy',
        )
      }
    >
      <Icon size={20} aria-hidden="true" />
      {item.label}
      {badge}
    </NavLink>
  )
}

interface DashboardLayoutProps {
  slug: string | null
  businessName?: string
  logoUrl?: string | null
  pendingReview?: number
  children: ReactNode
}

// Shared shell for every /dashboard/* screen: a sidebar on desktop, a wrapping
// top nav below 1024px (no drawer, so no focus trapping to get wrong).
export function DashboardLayout({
  slug,
  businessName,
  logoUrl,
  pendingReview = 0,
  children,
}: DashboardLayoutProps) {
  const items = navItems(slug)
  const navigate = useNavigate()

  function logOut() {
    forgetTenant()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="border-b border-border bg-white lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-4 p-4 lg:h-full lg:gap-6 lg:py-6">
          <a href="/" aria-label="OneBridge home" className="block">
            <img
              src="/brand/logo-primary.png"
              alt="OneBridge"
              className="h-10 w-auto max-w-[150px] object-contain object-left"
            />
          </a>

          <nav aria-label="Dashboard" className="flex flex-wrap gap-1 lg:flex-col">
            {items.map((item) => (
              <NavEntry key={item.label} item={item} pendingReview={pendingReview} />
            ))}
          </nav>

          {businessName && (
            <button
              type="button"
              onClick={logOut}
              title="Log out"
              aria-label={`Log out of ${businessName}`}
              className="group mt-auto hidden w-full items-center justify-center gap-3 rounded-[10px] bg-gray p-3 text-left transition-colors hover:bg-subtle-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2 lg:flex"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-[47px] w-[47px] shrink-0 rounded-[10px] border border-border bg-white object-contain p-1"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-[47px] w-[47px] shrink-0 place-items-center rounded-[10px] bg-action-blue text-lg font-bold text-white"
                >
                  {businessName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-secondary">Managing</span>
                <span className="block truncate text-sm font-bold text-navy">{businessName}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-secondary group-hover:text-navy">
                  <LogOut size={12} aria-hidden="true" /> Log out
                </span>
              </span>
            </button>
          )}
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1160px]">{children}</div>
      </main>
    </div>
  )
}
