import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'

const GAUGE_RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

function getScoreColor(score) {
  if (score >= 80) return '#059669'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 45) return 'Warning'
  return 'Critical'
}

export default function HealthScoreGauge({ score, totalProducts, loading }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (loading) return
    const timeout = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timeout)
  }, [score, loading])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 flex flex-col items-center justify-center animate-pulse min-h-[260px]">
        <div className="w-36 h-36 rounded-full bg-gray-100" />
        <div className="h-4 w-28 bg-gray-100 rounded mt-4" />
        <div className="h-3 w-20 bg-gray-50 rounded mt-2" />
      </div>
    )
  }

  const color = getScoreColor(animatedScore)
  const label = getScoreLabel(animatedScore)
  const dashOffset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE

  return (
    <div className="bg-white rounded-xl border border-border p-6 flex flex-col items-center justify-center">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64" cy="64" r={GAUGE_RADIUS}
            fill="none" stroke="#F1F5F9" strokeWidth="12"
          />
          <circle
            cx="64" cy="64" r={GAUGE_RADIUS}
            fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-extrabold" style={{ color }}>
            {animatedScore}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color }}>
            {label}
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-text mt-3 flex items-center gap-1.5">
        <Activity className="w-4 h-4" style={{ color }} />
        Store Health Score
      </p>
      <p className="text-xs text-muted mt-1">Based on {totalProducts} products</p>
    </div>
  )
}
