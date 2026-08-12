import type { Deal } from './types'

export const DAY_MS = 24 * 60 * 60 * 1000

export interface ProductionDeadline {
  startedAt: string
  deadlineAt: string
  daysRemaining: number
  overdue: boolean
}

export function getProductionDeadline(deal: Deal): ProductionDeadline | null {
  if (deal.estimatedProductionDays == null) return null

  const startedEntry = deal.statusHistory.find((h) => h.status === 'in_production')
  if (!startedEntry) return null

  const startedAt = startedEntry.at
  const deadlineTime = new Date(startedAt).getTime() + deal.estimatedProductionDays * DAY_MS
  const deadlineAt = new Date(deadlineTime).toISOString()
  const daysRemaining = Math.ceil((deadlineTime - Date.now()) / DAY_MS)

  return {
    startedAt,
    deadlineAt,
    daysRemaining,
    overdue: daysRemaining < 0,
  }
}
