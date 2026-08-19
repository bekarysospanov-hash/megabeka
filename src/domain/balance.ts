import type { Deal, Transaction, TransferRequest } from './types'

export function calculateAvailableBalance(
  dealId: string,
  transactions: Transaction[],
  transferRequests: TransferRequest[],
): number {
  const received = transactions.filter((t) => t.dealId === dealId).reduce((sum, t) => sum + t.amount, 0)
  // Исполненный запрос вычитается наравне с необработанным: деньги по нему ушли со счёта
  // сделки, и вернуть их в доступный баланс значило бы выплатить одну сумму дважды.
  // Отклонённый — единственный, что не вычитается: он денег не двигал.
  const requested = transferRequests
    .filter((r) => r.dealId === dealId && r.status !== 'rejected')
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
