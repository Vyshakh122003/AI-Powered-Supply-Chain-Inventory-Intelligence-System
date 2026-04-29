import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Suppliers from './pages/Suppliers'
import Alerts from './pages/Alerts'
import Reorder from './pages/Reorder'
import Deliveries from './pages/Deliveries'
import QuickUpdate from './pages/QuickUpdate'
import Logs from './pages/Logs'
import Settings from './pages/Settings'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      <Route path="/reorder" element={<ProtectedRoute><Reorder /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
      <Route path="/quick-update" element={<ProtectedRoute><QuickUpdate /></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
