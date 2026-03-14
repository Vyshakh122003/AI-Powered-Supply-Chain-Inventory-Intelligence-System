export default function KPICard({ title, value, icon: Icon, color = 'text-accent', subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-start gap-4">
      {Icon && (
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
          color === 'text-danger' ? 'bg-red-50' :
          color === 'text-warning' ? 'bg-orange-50' :
          color === 'text-success' ? 'bg-green-50' :
          'bg-blue-50'
        }`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted font-medium">{title}</p>
        <p className="text-2xl font-bold text-text mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
