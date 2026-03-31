/**
 * Format number to Indonesian Rupiah currency
 */
export function formatRupiah(amount) {
  if (amount === null || amount === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format number with thousand separators (dot)
 */
export function formatNumber(amount) {
  if (amount === null || amount === undefined || amount === 0) return ''
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Parse string with thousand separators back to number
 */
export function parseNumber(string) {
  if (!string) return 0
  return parseInt(string.replace(/\./g, '')) || 0
}
/**
 * Format date to Indonesian locale
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format short date
 */
export function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
