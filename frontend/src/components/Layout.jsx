import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  RotateCcw,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  WifiOff,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/reorder', label: 'Reorder', icon: RotateCcw },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const { signOut, storeProfile } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch {
      toast.error('Failed to log out')
    }
  }

  const storeName = storeProfile?.store_name || 'StockSense AI'

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Offline banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-danger text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          You are offline. Some features may not work.
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isOffline ? 'mt-10 lg:mt-10' : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Package className="w-7 h-7 text-blue-300" />
              <span className="text-lg font-bold tracking-tight">StockSense AI</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className={`bg-white border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between shrink-0 ${
            isOffline ? 'mt-10' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-text" />
            </button>
            <h2 className="text-base font-semibold text-text truncate">{storeName}</h2>
          </div>
          <button
            onClick={handleLogout}
            className="hidden lg:flex items-center gap-2 text-sm text-muted hover:text-danger transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom tabs - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border lg:hidden z-30">
        <div className="flex justify-around items-center py-1">
          {navItems.slice(0, 5).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
