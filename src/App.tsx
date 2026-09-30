import { Route, Routes } from 'react-router-dom'

import { Landing } from '@/pages/Landing'
import { Placeholder } from '@/pages/Placeholder'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Placeholder title="Log in" slice="M11" />} />
      <Route path="/register" element={<Placeholder title="Set up your business" slice="M11" />} />
      <Route path="/setup" element={<Placeholder title="Setup wizard" slice="M11" />} />
      <Route path="/dashboard" element={<Placeholder title="Dashboard" slice="M4" />} />
      <Route
        path="/dashboard/monitoring"
        element={<Placeholder title="AI visibility monitoring" slice="M8" />}
      />
      <Route
        path="/dashboard/review"
        element={<Placeholder title="Governance review queue" slice="M9" />}
      />
      <Route path="*" element={<Placeholder title="Not found" slice="-" />} />
    </Routes>
  )
}

export default App
