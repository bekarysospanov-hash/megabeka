import { getProductionDeadline } from './productionTimer'
import type { Deal } from './types'

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
