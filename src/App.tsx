import { Route, Routes } from 'react-router-dom'

import { Dashboard } from '@/pages/Dashboard'
import { DashboardSection } from '@/pages/DashboardSection'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Monitoring } from '@/pages/Monitoring'
import { Placeholder } from '@/pages/Placeholder'
import { Register } from '@/pages/Register'
import { ReviewQueue } from '@/pages/ReviewQueue'
import { Setup } from '@/pages/Setup'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/monitoring" element={<Monitoring />} />
      <Route path="/dashboard/review" element={<ReviewQueue />} />
      <Route
        path="/dashboard/products"
        element={
          <DashboardSection
            title="Products"
            summary="Full catalog view and editing. For now, products are listed on the Dashboard tab."
          />
        }
      />
      <Route
        path="/dashboard/mcp"
        element={
          <DashboardSection
            title="MCP servers"
            summary="Connection details, tool list, and request log for this business's MCP server."
          />
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <DashboardSection
            title="Settings"
            summary="Business profile, hours, policies, and account options."
          />
        }
      />
      <Route path="*" element={<Placeholder title="Not found" slice="-" />} />
    </Routes>
  )
}

export default App
