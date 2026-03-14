/**
 * Format a number as Indian Rupee currency
 */
export function formatCurrency(val) {
  if (val == null || isNaN(val)) return '₹0'
  return `₹${Number(val).toLocaleString('en-IN')}`
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format a date string to include time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get health score color class based on value
 */
export function getHealthColor(score) {
  if (score >= 80) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-danger'
}

/**
 * Get health score background color class
 */
export function getHealthBg(score) {
  if (score >= 80) return 'bg-green-50'
  if (score >= 50) return 'bg-orange-50'
  return 'bg-red-50'
}

/**
 * Get risk badge classes
 */
export function getRiskClasses(riskLevel) {
  switch (riskLevel?.toUpperCase()) {
    case 'HIGH':
      return 'bg-red-100 text-red-700'
    case 'MEDIUM':
      return 'bg-orange-100 text-orange-700'
    case 'LOW':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/**
 * Get supplier grade badge classes
 */
export function getGradeClasses(grade) {
  switch (grade?.toUpperCase()) {
    case 'A':
      return 'bg-green-100 text-green-700'
    case 'B':
      return 'bg-blue-100 text-blue-700'
    case 'C':
      return 'bg-yellow-100 text-yellow-700'
    case 'D':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/**
 * Calculate health score from product risk counts
 */
export function calculateHealthScore(low, medium, total) {
  if (!total || total === 0) return 0
  return Math.round(((low * 1.0 + medium * 0.5) / total) * 100)
}
