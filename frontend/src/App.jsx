import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Products = lazy(() => import('./pages/Products'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Reorder = lazy(() => import('./pages/Reorder'))
const Suppliers = lazy(() => import('./pages/Suppliers'))

const Settings = lazy(() => import('./pages/Settings'))
const QuickUpdate = lazy(() => import('./pages/QuickUpdate'))
const Deliveries = lazy(() => import('./pages/Deliveries'))
const Logs = lazy(() => import('./pages/Logs'))

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted">Loading...</p>
      </div>
    </div>
  )
}

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
        <Suspense fallback={<LoadingFallback />}>
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

            <Route path="/settings" element={<Settings />} />
            <Route path="/quick-update" element={<QuickUpdate />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/logs" element={<Logs />} />
          </Route>

          {/* Default: unauthenticated → landing, authenticated → dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
