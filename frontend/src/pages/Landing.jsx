import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Package, BarChart3, AlertTriangle, Truck, Brain,
  MessageCircle, ArrowRight, Loader2,
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Smart Inventory Tracking',
    desc: 'Real-time stock levels with automated risk classification. Know exactly what needs attention.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Reorder Suggestions',
    desc: 'Groq LLM analyzes your sales patterns and recommends optimal reorder quantities and timing.',
  },
  {
    icon: AlertTriangle,
    title: 'Proactive Stock Alerts',
    desc: 'Get notified before you run out. Automated alerts based on stockout date predictions.',
  },
  {
    icon: Truck,
    title: 'Supplier Intelligence',
    desc: 'Score and rank suppliers on reliability and pricing. Make data-driven procurement decisions.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Notifications',
    desc: 'Critical alerts delivered straight to your WhatsApp. Never miss a stockout warning.',
  },
  {
    icon: Package,
    title: 'Built for Kirana Stores',
    desc: 'Designed specifically for Indian retail. Simple, fast, and works on any device.',
  },
]

const stats = [
  { value: '8', label: 'Automated Workflows' },
  { value: 'AI', label: 'Powered by Groq LLM' },
  { value: '24/7', label: 'Pipeline Monitoring' },
  { value: '< 5 min', label: 'Setup Time' },
]

export default function Landing() {
  const { session, loading } = useAuth()
  const isAuthenticated = !loading && session

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Navbar ─────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text tracking-tight">StockSense AI</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium bg-accent text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted hover:text-text transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium bg-accent text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Brain className="w-3.5 h-3.5" />
          AI-Powered Inventory Intelligence
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text leading-tight max-w-3xl mx-auto">
          Never run out of stock{' '}
          <span className="text-accent">again</span>
        </h1>
        <p className="mt-5 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          StockSense AI uses automated n8n workflows and Groq LLM to predict stockouts,
          generate smart reorder suggestions, and keep your kirana store running smoothly.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-white text-text border border-border px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────── */}
      <section className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-text">
            Everything your store needs
          </h2>
          <p className="text-muted mt-2 max-w-xl mx-auto">
            A complete supply chain intelligence system built on automation and AI.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text">How it works</h2>
            <p className="text-muted mt-2">Three simple steps to intelligent inventory management</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Add your products',
                desc: 'Enter your inventory items with stock levels and sales data. Import via CSV or add manually.',
              },
              {
                step: '2',
                title: 'AI analyzes patterns',
                desc: 'Our automated pipeline calculates stockout dates, classifies risk, and generates reorder suggestions.',
              },
              {
                step: '3',
                title: 'Get actionable alerts',
                desc: 'Receive smart alerts on the dashboard and WhatsApp. Act on AI recommendations to stay stocked.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-text mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-text">
          Ready to take control of your inventory?
        </h2>
        <p className="text-muted mt-2 max-w-lg mx-auto">
          Join store owners who have automated their supply chain decisions with AI.
        </p>
        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors mt-6"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors mt-6"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="bg-primary text-white/70 text-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-300" />
            <span className="font-semibold text-white">StockSense AI</span>
          </div>
          <p>Senior Design Project &mdash; VIT-AP University</p>
        </div>
      </footer>
    </div>
  )
}
