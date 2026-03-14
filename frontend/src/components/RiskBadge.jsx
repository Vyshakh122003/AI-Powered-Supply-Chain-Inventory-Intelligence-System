import { getRiskClasses } from '../lib/helpers'

export default function RiskBadge({ level }) {
  const classes = getRiskClasses(level)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {level || 'UNKNOWN'}
    </span>
  )
}
