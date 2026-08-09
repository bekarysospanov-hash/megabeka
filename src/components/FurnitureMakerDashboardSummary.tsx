import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { dealsNeedingAttention } from '../domain/attention'
import { calculateTotalBalance } from '../domain/balance'
import { getProductionDeadline } from '../domain/productionTimer'
import { groupDealsByStage } from '../domain/progressStages'
import { formatMoney } from '../domain/statusLabels'
import type { Deal, Transaction, TransferRequest } from '../domain/types'

export function FurnitureMakerDashboardSummary({
  deals,
  transactions,
  transferRequests,
}: {
  deals: Deal[]
  transactions: Transaction[]
  transferRequests: TransferRequest[]
}) {
  if (deals.length === 0) return null

  const totalBalance = calculateTotalBalance(deals, transactions, transferRequests)
  const stageGroups = groupDealsByStage(deals).filter((g) => g.deals.length > 0)
  const attention = dealsNeedingAttention(deals)

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="p-4">
        <div className="text-xs text-muted-foreground">Баланс по всем сделкам</div>
        <div className="mt-1 text-lg font-semibold">{formatMoney(totalBalance)}</div>
      </Card>

      <Card className="p-4">
        <div className="mb-1 text-xs text-muted-foreground">По этапам</div>
        {stageGroups.length === 0 ? (
          <div className="text-sm text-muted-foreground">Нет активных сделок</div>
        ) : (
          <ul className="grid gap-0.5 text-sm">
            {stageGroups.map((g) => (
              <li key={g.stage.key} className="flex justify-between">
                <span className="text-muted-foreground">{g.stage.label}</span>
                <span className="font-medium">{g.deals.length}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className={attention.length > 0 ? 'border-destructive/40 bg-destructive/5 p-4' : 'p-4'}>
        <div className="mb-1 text-xs text-muted-foreground">Требует внимания</div>
        {attention.length === 0 ? (
          <div className="text-sm text-muted-foreground">Нет сделок, требующих внимания</div>
        ) : (
          <ul className="grid gap-1 text-sm">
            {attention.map((deal) => {
              const overdue = getProductionDeadline(deal)?.overdue
              const reason = deal.status === 'dispute_open' ? 'спор' : overdue ? 'просрочено производство' : ''
              return (
                <li key={deal.id}>
                  <Link to={`/furniture-maker/deal/${deal.id}`} className="text-destructive underline">
                    {deal.title}
                  </Link>{' '}
                  <span className="text-muted-foreground">— {reason}</span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
