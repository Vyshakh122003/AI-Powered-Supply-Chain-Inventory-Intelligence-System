import { Truck } from 'lucide-react'

const GRADE_COLORS = {
  A: { bar: '#059669', badge: 'bg-green-100 text-green-700' },
  B: { bar: '#2563EB', badge: 'bg-blue-100 text-blue-700' },
  C: { bar: '#D97706', badge: 'bg-yellow-100 text-yellow-700' },
  D: { bar: '#DC2626', badge: 'bg-red-100 text-red-700' },
}

export default function SupplierPerformanceList({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse min-h-[280px]">
        <div className="h-4 w-36 bg-gray-100 rounded mb-4" />
        <div className="space-y-5 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
              <div className="h-2.5 w-full bg-gray-50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center min-h-[280px]">
        <Truck className="w-8 h-8 text-muted mb-2" />
        <p className="text-sm font-medium text-muted">No suppliers</p>
        <p className="text-xs text-muted">Add suppliers to see performance</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
        <Truck className="w-4 h-4 text-green-600" />
        Supplier Performance
      </h3>
      <div className="space-y-4">
        {data.map(s => {
          const grade = GRADE_COLORS[s.grade] || GRADE_COLORS.D
          return (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-text truncate mr-2">{s.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${grade.badge}`}>
                    {s.grade || '—'}
                  </span>
                  <span className="text-xs font-bold text-text w-7 text-right">{s.value}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(s.value, 100)}%`, backgroundColor: grade.bar }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-muted text-center mt-4">
        Composite score out of 100 (40% reliability · 35% price · 25% speed)
      </p>
    </div>
  )
}
