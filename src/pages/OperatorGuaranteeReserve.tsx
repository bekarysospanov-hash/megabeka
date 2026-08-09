import { Card } from '@/components/ui/card'
import { StatusBadge } from '../components/StatusBadge'
import { useDemoState } from '../store/DemoProvider'
import { GUARANTEE_RESERVE_LIMIT, dealsOccupyingReserve } from '../domain/guaranteeReserve'
import { formatMoney } from '../domain/statusLabels'

export function OperatorGuaranteeReserve() {
  const { deals } = useDemoState()
  const occupying = dealsOccupyingReserve(Object.values(deals))
  const limit = GUARANTEE_RESERVE_LIMIT
  const used = occupying.reduce((sum, deal) => sum + deal.amount, 0)
  const available = limit - used

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Резерв гарантии</h1>
      <p className="text-sm text-muted-foreground">
        Общий пул гарантии Asia Mebel на площадку. Первый шаг к формализации резервного фонда (раздел 7 ТЗ).
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Лимит</div>
          <div className="mt-1 text-lg font-semibold">{formatMoney(limit)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Занято</div>
          <div className="mt-1 text-lg font-semibold">{formatMoney(used)}</div>
        </Card>
        <Card className={available < 0 ? 'border-destructive/40 bg-destructive/5 p-4' : 'p-4'}>
          <div className="text-xs text-muted-foreground">Доступно</div>
          <div className={available < 0 ? 'mt-1 text-lg font-semibold text-destructive' : 'mt-1 text-lg font-semibold'}>
            {formatMoney(available)}
          </div>
        </Card>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Сделки, занимающие резерв</h2>
        {occupying.length === 0 ? (
          <p className="text-sm text-muted-foreground">Сейчас нет сделок, занимающих резерв гарантии.</p>
        ) : (
          <div className="grid gap-2">
            {occupying.map((deal) => (
              <Card key={deal.id} className="flex items-center justify-between gap-4 p-4">
                <div className="font-medium">{deal.title}</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{formatMoney(deal.amount)}</span>
                  <StatusBadge status={deal.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
