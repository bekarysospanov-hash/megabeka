import { PRE_ACCEPTANCE_SHARE_CAP } from './dealLimits'
import type { Deal, DealStatus, Transaction } from './types'

/**
 * Резервный фонд платформы — собственные деньги, из которых клиенту возвращается сумма
 * сверх остатка удержания. Решение PM (PRD, раздел 3.3): 5 млн ₸ на пилот.
 *
 * Не путать с DEAL_AMOUNT_LIMIT (dealLimits.ts) — это лимит суммы ОДНОЙ сделки, 2 млн ₸.
 */
export const GUARANTEE_RESERVE_LIMIT = 5_000_000

/**
 * Резерв занимают сделки, которые клиент уже видит: гарантия становится связывающей в момент
 * отправки клиенту, а не раньше. Поэтому черновик и сделка на одобрении оператора покрытие не
 * едят — иначе четыре неодобренные заявки заблокировали бы приём обычных сделок.
 */
const NON_RESERVE_STATUSES: DealStatus[] = [
  'draft',
  'pending_approval',
  'completed',
  'cancelled_refunded',
  'cancelled',
]

export function dealsOccupyingReserve(deals: Deal[]): Deal[] {
  return deals.filter((deal) => !NON_RESERVE_STATUSES.includes(deal.status))
}

/**
 * Сколько платформа рискует по одной сделке — то есть сколько придётся возместить из
 * собственного резерва, если дело кончится полным возвратом клиенту.
 *
 * Это доля, уходящая мебельщику **до приёмки**: её платформа уже не может вернуть из
 * удержанного, потому что удержанного столько не осталось. Финальная доля в риск не входит —
 * она выплачивается только после того, как клиент принял работу, и возвращать её незачем.
 */
export function dealRiskAmount(deal: Deal): number {
  const preAcceptanceShare = Math.min(
    deal.prepaymentPercent + deal.interimPercent,
    PRE_ACCEPTANCE_SHARE_CAP,
  )
  return Math.round((deal.amount * preAcceptanceShare) / 100)
}

/**
 * Экспозиция резерва (FR-38). Считается как максимум из двух величин по каждой активной
 * сделке: расчётного риска и фактически выплаченного.
 *
 * Почему не только выплаченное, как было раньше: тогда гейт срабатывал задним числом.
 * Сделка проходила проверку, пока по ней не было выплат, и пробивала резерв позже, когда
 * оператор подтверждал этап, — то есть ровно в момент, когда отказать уже нельзя. Считая
 * риск заранее, платформа держится «в рамках суммы страхования», а не догоняет её.
 *
 * Фактическая выплата не суммируется с расчётным риском: это одни и те же деньги, а не
 * двойное обязательство. Если выплачено больше расчёта — берётся факт.
 */
export function calculateGuaranteeReserve(
  deals: Deal[],
  transactions: Transaction[],
): {
  limit: number
  used: number
  available: number
} {
  const used = dealsOccupyingReserve(deals).reduce((sum, deal) => {
    const paidOut = transactions
      .filter((t) => t.dealId === deal.id)
      .reduce((acc, t) => acc + t.amount, 0)
    return sum + Math.max(dealRiskAmount(deal), paidOut)
  }, 0)

  return {
    limit: GUARANTEE_RESERVE_LIMIT,
    used,
    available: GUARANTEE_RESERVE_LIMIT - used,
  }
}

/**
 * Помещается ли новая сделка в остаток резерва. Проверяется до отправки клиенту: платформа
 * не берёт на себя обязательство, которое не сможет исполнить.
 */
export function fitsInReserve(
  deals: Deal[],
  transactions: Transaction[],
  newDealAmount: number,
  preAcceptancePercent: number,
): boolean {
  const { available } = calculateGuaranteeReserve(deals, transactions)
  const share = Math.min(preAcceptancePercent, PRE_ACCEPTANCE_SHARE_CAP)
  const newDealRisk = Math.round((newDealAmount * share) / 100)
  return newDealRisk <= available
}
