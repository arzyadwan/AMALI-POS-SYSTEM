/**
 * Credit calculation utilities for AMALI KREDIT
 */

export const CREDIT_FACTORS = {
  3: 0.368,
  6: 0.208,
  9: 0.1475,
  12: 0.121
}

export const ADMIN_FEE = 200000
export const TENOR_OPTIONS = [3, 6, 9, 12]

/**
 * Calculate monthly installment
 * M = P × F
 */
export function calculateMonthly(principal, tenor) {
  const factor = CREDIT_FACTORS[tenor]
  if (!factor) return 0
  return Math.round(principal * factor)
}

/**
 * Calculate total credit obligation
 * TP = M × T
 */
export function calculateTotalCredit(principal, tenor) {
  const monthly = calculateMonthly(principal, tenor)
  return monthly * tenor
}

/**
 * Calculate early payoff amount
 * S = (P × F_target × T_target) - (M_current × n)
 */
export function calculateEarlyPayoff(principal, currentTenor, targetTenor, paidMonths) {
  const currentMonthly = calculateMonthly(principal, currentTenor)
  const targetTotal = calculateTotalCredit(principal, targetTenor)
  return targetTotal - (currentMonthly * paidMonths)
}

/**
 * Get comparison table for all tenors
 */
export function getAllTenorComparison(principal) {
  return TENOR_OPTIONS.map(tenor => {
    const monthly = calculateMonthly(principal, tenor)
    const total = monthly * tenor
    const margin = total - principal
    return {
      tenor,
      factor: CREDIT_FACTORS[tenor],
      monthly,
      total,
      margin,
      marginPercent: principal > 0 ? ((margin / principal) * 100).toFixed(1) : '0'
    }
  })
}
