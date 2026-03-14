import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Alerts from './pages/Alerts'
import Reorder from './pages/Reorder'
import Suppliers from './pages/Suppliers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import QuickUpdate from './pages/QuickUpdate'
import Deliveries from './pages/Deliveries'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            success: {
              style: { background: '#059669', color: '#fff' },
              iconTheme: { primary: '#fff', secondary: '#059669' },
            },
            error: {
              style: { background: '#DC2626', color: '#fff' },
              iconTheme: { primary: '#fff', secondary: '#DC2626' },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Auth-required but no sidebar layout */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reorder" element={<Reorder />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/quick-update" element={<QuickUpdate />} />
            <Route path="/deliveries" element={<Deliveries />} />
          </Route>

          {/* Default: unauthenticated → landing, authenticated → dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
