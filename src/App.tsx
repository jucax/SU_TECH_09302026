import { Route, Routes } from 'react-router-dom'

import { Dashboard } from '@/pages/Dashboard'
import { Demo } from '@/pages/Demo'
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
      <Route path="/demo" element={<Demo />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/monitoring" element={<Monitoring />} />
      <Route path="/dashboard/review" element={<ReviewQueue />} />
      <Route path="*" element={<Placeholder title="Not found" slice="-" />} />
    </Routes>
  )
}

export default App
