import type { Deal } from './types'

/**
 * Четыре исхода спора по FR-26. Набор закрыт: раздел 16.2, п. 24 запрещает придумывать пятый,
 * а п. 8 — делать «устранение» доступным вне окна приёмки.
 */
export type DisputeResolutionKind = 'rejected' | 'partial_refund' | 'full_refund' | 'remedy'

/** Судьба изделия при возврате — обязательна к заполнению (FR-27). */
export type ItemFate = 'stays_with_client' | 'returns_to_craftsman' | 'disposed'

/** Сторона, несущая расходы на демонтаж и вывоз. По умолчанию мебельщик — решение PM. */
export type RemovalCostBearer = 'client' | 'craftsman' | 'platform'

export type DisputeResolution =
  | { kind: 'rejected'; newDeadline: string }
  | {
      kind: 'partial_refund'
      refundAmount: number
      itemFate: ItemFate
      removalCostBearer: RemovalCostBearer
    }
  | { kind: 'full_refund'; itemFate: ItemFate; removalCostBearer: RemovalCostBearer }
  | { kind: 'remedy'; remedyDeadline: string }

/**
 * Исход «устранение недостатков» доступен, только если спор открыт из окна приёмки: до
 * заявления готовности устранять ещё нечего, изделия клиент не видел.
 */
export function availableResolutions(deal: Deal): DisputeResolutionKind[] {
  const base: DisputeResolutionKind[] = ['rejected', 'partial_refund', 'full_refund']
  const fromAcceptanceWindow =
    deal.previousStatus === 'awaiting_acceptance' || deal.previousStatus === 'act_signing'
  return fromAcceptanceWindow ? [...base, 'remedy'] : base
}

/**
 * Остаток, причитающийся мебельщику при частичном возврате (FR-26). Отрицательное значение
 * означает, что арбитр назначил возврат больше возможного при уже сделанных выплатах —
 * такую разницу оформляют полным возвратом из резерва, а не частичным.
 */
export function remainderForCraftsman(
  totalAmount: number,
  refundAmount: number,
  paidOutAmount: number,
): number {
  return totalAmount - refundAmount - paidOutAmount
}

export const ITEM_FATE_LABELS: Record<ItemFate, string> = {
  stays_with_client: 'Остаётся у клиента',
  returns_to_craftsman: 'Возвращается мебельщику',
  disposed: 'Утилизируется',
}

export const REMOVAL_COST_BEARER_LABELS: Record<RemovalCostBearer, string> = {
  client: 'Клиент',
  craftsman: 'Мебельщик',
  platform: 'Платформа',
}

export const RESOLUTION_LABELS: Record<DisputeResolutionKind, string> = {
  rejected: 'Спор отклонён',
  partial_refund: 'Частичный возврат клиенту',
  full_refund: 'Полный возврат клиенту',
  remedy: 'Устранение недостатков',
}
