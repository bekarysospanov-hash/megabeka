import type { Deal, Transaction, TransferRequest } from './types'

export function calculateAvailableBalance(
  dealId: string,
  transactions: Transaction[],
  transferRequests: TransferRequest[],
): number {
  const received = transactions.filter((t) => t.dealId === dealId).reduce((sum, t) => sum + t.amount, 0)
  const requested = transferRequests
    .filter((r) => r.dealId === dealId)
    .reduce((sum, r) => sum + r.amount, 0)
  return received - requested
}

export function calculateTotalBalance(
  deals: Deal[],
  transactions: Transaction[],
  transferRequests: TransferRequest[],
): number {
  return deals.reduce(
    (sum, deal) => sum + calculateAvailableBalance(deal.id, transactions, transferRequests),
    0,
  )
}
