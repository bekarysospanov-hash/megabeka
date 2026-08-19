import type { Deal, DealStatus, Transaction } from './types'

/**
 * Резервный фонд платформы — собственные деньги, из которых клиенту возвращается сумма
 * сверх остатка удержания. Решение PM (PRD, раздел 3.3): 5 млн ₸ на пилот.
 *
 * Не путать с DEAL_AMOUNT_LIMIT (dealLimits.ts) — это лимит суммы ОДНОЙ сделки, 2 млн ₸.
 * Раньше здесь стояло 2 млн, из-за чего два разных продуктовых решения выглядели одним.
 */
export const GUARANTEE_RESERVE_LIMIT = 5_000_000

const NON_RESERVE_STATUSES: DealStatus[] = ['draft', 'completed', 'cancelled_refunded', 'cancelled']

export function dealsOccupyingReserve(deals: Deal[]): Deal[] {
  return deals.filter((deal) => !NON_RESERVE_STATUSES.includes(deal.status))
}

/**
 * Экспозиция резерва по FR-38: сумма выплаченных траншей по сделкам во всех статусах,
 * кроме терминальных. Под риском платформы находится не полная сумма сделки, а только то,
 * что уже ушло мебельщику: пока деньги лежат на счету платформы, возврат клиенту берётся
 * из них самих и резерв не расходует.
 */
export function calculateGuaranteeReserve(
  deals: Deal[],
  transactions: Transaction[],
): {
  limit: number
  used: number
  available: number
} {
  const exposedDealIds = new Set(dealsOccupyingReserve(deals).map((deal) => deal.id))
  const used = transactions
    .filter((transaction) => exposedDealIds.has(transaction.dealId))
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  return {
    limit: GUARANTEE_RESERVE_LIMIT,
    used,
    available: GUARANTEE_RESERVE_LIMIT - used,
  }
}
