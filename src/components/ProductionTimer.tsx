import { getProductionDeadline } from '../domain/productionTimer'
import type { Deal } from '../domain/types'

export function ProductionTimer({ deal }: { deal: Deal }) {
  const deadline = getProductionDeadline(deal)
  if (!deadline) return null

  if (deadline.overdue) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
        Просрочено на {Math.abs(deadline.daysRemaining)} дн. — уточните у мебельщика статус заказа.
      </div>
    )
  }

  return (
    <div className="rounded-md border border-info/30 bg-info/10 px-3.5 py-2.5 text-sm text-info">
      Осталось примерно {deadline.daysRemaining} дн. до готовности.
    </div>
  )
}
