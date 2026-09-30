import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { Landing } from '@/pages/Landing'
import { NotFound } from '@/pages/NotFound'

// The landing page loads eagerly because it's the first thing a visitor sees.
// Everything else is split per route, so the landing page doesn't download the
// demo, the dashboard, or the charting library until someone navigates there.
const Demo = lazy(() => import('@/pages/Demo').then((m) => ({ default: m.Demo })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const DashboardMcp = lazy(() => import('@/pages/DashboardMcp').then((m) => ({ default: m.DashboardMcp })))
const DashboardProducts = lazy(() =>
  import('@/pages/DashboardProducts').then((m) => ({ default: m.DashboardProducts })),
)
const DashboardAnalytics = lazy(() =>
  import('@/pages/DashboardAnalytics').then((m) => ({ default: m.DashboardAnalytics })),
)
const DashboardTest = lazy(() =>
  import('@/pages/DashboardTest').then((m) => ({ default: m.DashboardTest })),
)
const DashboardSettings = lazy(() =>
  import('@/pages/DashboardSettings').then((m) => ({ default: m.DashboardSettings })),
)
const Monitoring = lazy(() => import('@/pages/Monitoring').then((m) => ({ default: m.Monitoring })))
const ReviewQueue = lazy(() => import('@/pages/ReviewQueue').then((m) => ({ default: m.ReviewQueue })))

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray" aria-busy="true" />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/mcp" element={<DashboardMcp />} />
        <Route path="/dashboard/products" element={<DashboardProducts />} />
        <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
        <Route path="/dashboard/test" element={<DashboardTest />} />
        <Route path="/dashboard/review" element={<ReviewQueue />} />
        <Route path="/dashboard/settings" element={<DashboardSettings />} />
        <Route path="/dashboard/monitoring" element={<Monitoring />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
