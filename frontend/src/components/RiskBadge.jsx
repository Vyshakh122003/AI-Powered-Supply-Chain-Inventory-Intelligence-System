import { getRiskClasses } from '../lib/helpers'

export default function RiskBadge({ level, stock }) {
  const isOos = stock === 0
  const displayLevel = isOos ? 'OOS' : level
  const classes = getRiskClasses(displayLevel)
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {displayLevel || 'UNKNOWN'}
    </span>
  )
}
