import { Route, Routes } from 'react-router-dom'

import { Dashboard } from '@/pages/Dashboard'
import { Demo } from '@/pages/Demo'
import { DashboardAnalytics } from '@/pages/DashboardAnalytics'
import { DashboardMcp } from '@/pages/DashboardMcp'
import { DashboardProducts } from '@/pages/DashboardProducts'
import { DashboardSettings } from '@/pages/DashboardSettings'
import { DashboardTest } from '@/pages/DashboardTest'
import { Landing } from '@/pages/Landing'
import { Monitoring } from '@/pages/Monitoring'
import { Placeholder } from '@/pages/Placeholder'
import { ReviewQueue } from '@/pages/ReviewQueue'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/monitoring" element={<Monitoring />} />
      <Route path="/dashboard/review" element={<ReviewQueue />} />
      <Route path="/dashboard/mcp" element={<DashboardMcp />} />
      <Route path="/dashboard/products" element={<DashboardProducts />} />
      <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
      <Route path="/dashboard/settings" element={<DashboardSettings />} />
      <Route path="/dashboard/test" element={<DashboardTest />} />
      <Route path="*" element={<Placeholder title="Not found" slice="-" />} />
    </Routes>
  )
}

export default App
