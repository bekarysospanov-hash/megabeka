import type { Deal, DealStatus } from './types'

export const GUARANTEE_RESERVE_LIMIT = 2_000_000

const NON_RESERVE_STATUSES: DealStatus[] = ['draft', 'completed', 'cancelled_refunded']

export function dealsOccupyingReserve(deals: Deal[]): Deal[] {
  return deals.filter((deal) => !NON_RESERVE_STATUSES.includes(deal.status))
}

export function calculateGuaranteeReserve(deals: Deal[]): {
  limit: number
  used: number
  available: number
} {
  const used = dealsOccupyingReserve(deals).reduce((sum, deal) => sum + deal.amount, 0)
  return {
    limit: GUARANTEE_RESERVE_LIMIT,
    used,
    available: GUARANTEE_RESERVE_LIMIT - used,
  }
}
