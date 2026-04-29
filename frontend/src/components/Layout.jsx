import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, Boxes, Users, TriangleAlert, ShoppingCart, Truck, ScanLine, FileText, Settings, LogOut } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/products', label: 'Products', icon: Boxes },
  { to: '/suppliers', label: 'Suppliers', icon: Users },
  { to: '/alerts', label: 'Alerts', icon: TriangleAlert },
  { to: '/reorder', label: 'Reorder', icon: ShoppingCart },
  { to: '/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/quick-update', label: 'Quick Update', icon: ScanLine },
  { to: '/logs', label: 'Logs', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ title, children }) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-primary">StockSense AI</h1>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-primary hover:bg-surface"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-border bg-white p-3">
          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-accent text-white' : 'text-primary hover:bg-surface'}`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-primary">{title}</h2>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
