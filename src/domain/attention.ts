import { DAY_MS, getProductionDeadline } from './productionTimer'
import type { Deal, DealStatus, RevisionEntry } from './types'

export function dealsNeedingAttention(deals: Deal[]): Deal[] {
  return deals.filter(
    (deal) =>
      deal.status === 'dispute_open' ||
      // Просрочка актуальна только пока сделка ещё в производстве — как только она ушла
      // дальше по графу, деньги/сроки уже не в подвешенном состоянии (тот же гейт, что
      // ClientDealEntry.tsx использует для показа ProductionTimer).
      (deal.status === 'in_production' && getProductionDeadline(deal)?.overdue === true),
  )
}

// Сколько дней без движения считается "зависшей" сделкой — если ни одна сторона сама не
// позвала оператора, зависшая сделка иначе не подаёт вообще никакого сигнала (раздел 12 PRD, №7).
export const STALLED_THRESHOLD_DAYS = 3

const STALLED_EXCLUDED_STATUSES: DealStatus[] = [
  'completed',
  'cancelled',
  'cancelled_refunded',
  // dispute_open уже подсвечен отдельным сигналом (dealsNeedingAttention/сортировка оператора) —
  // дублировать тем же "завис" было бы избыточно.
  'dispute_open',
]

// "Движение" — это не только смена statusHistory, но и правки в negotiation: requestRevision/
// requestRevisions не трогают статус (сделка может пройти несколько раундов правок, оставаясь
// в negotiation), и без учёта revisions активные переговоры ложно попали бы в "зависшие".
export function daysSinceLastChange(deal: Deal, revisions: RevisionEntry[] = []): number {
  const lastStatusChange = deal.statusHistory[deal.statusHistory.length - 1]
  const timestamps = [
    ...(lastStatusChange ? [new Date(lastStatusChange.at).getTime()] : []),
    ...revisions.filter((r) => r.dealId === deal.id).map((r) => new Date(r.at).getTime()),
  ]
  if (timestamps.length === 0) return 0
  const lastActivity = Math.max(...timestamps)
  return Math.floor((Date.now() - lastActivity) / DAY_MS)
}

export function isDealStalled(deal: Deal, revisions: RevisionEntry[] = []): boolean {
  if (STALLED_EXCLUDED_STATUSES.includes(deal.status)) return false
  if (deal.statusHistory.length === 0) return false
  return daysSinceLastChange(deal, revisions) >= STALLED_THRESHOLD_DAYS
}
