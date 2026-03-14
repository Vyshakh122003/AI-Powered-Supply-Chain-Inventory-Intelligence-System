import { getGradeClasses } from '../lib/helpers'

export default function GradeBadge({ grade }) {
  const classes = getGradeClasses(grade)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      Grade {grade || '—'}
    </span>
  )
}
