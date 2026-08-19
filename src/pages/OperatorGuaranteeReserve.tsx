import { Card } from '@/components/ui/card'
import { StatusBadge } from '../components/StatusBadge'
import { useDemoState } from '../store/DemoProvider'
import { calculateGuaranteeReserve, dealsOccupyingReserve } from '../domain/guaranteeReserve'
import { formatMoney } from '../domain/statusLabels'
import { Money } from '../components/Money'

export function OperatorGuaranteeReserve() {
  const { deals, transactions } = useDemoState()
  const dealList = Object.values(deals)
  // Резерв занимают именно выплаты, поэтому в список попадают только сделки, по которым
  // хоть что-то переведено: сделка без траншей под заголовком «занимающие резерв» с нулём
  // напротив противоречила бы и заголовку, и цифре «Занято».
  const occupying = dealsOccupyingReserve(dealList)
    .map((deal) => ({
      deal,
      paidOut: transactions
        .filter((t) => t.dealId === deal.id)
        .reduce((sum, t) => sum + t.amount, 0),
    }))
    .filter((row) => row.paidOut > 0)
  // Раньше формула считалась здесь второй раз вручную и по-другому (сумма сделок вместо
  // выплаченных траншей) — теперь единственный источник расчёта общий с гейтом отправки.
  const { limit, used, available } = calculateGuaranteeReserve(dealList, transactions)

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Резерв гарантии</h1>
      <p className="text-sm text-muted-foreground">
        Общий пул гарантии Asia Mebel на площадку — лимит, занятая и доступная часть по всем активным сделкам.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Лимит</div>
          <div className="mt-1 text-lg font-semibold"><Money amount={limit} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Занято</div>
          <div className="mt-1 text-lg font-semibold"><Money amount={used} /></div>
        </Card>
        <Card className={available < 0 ? 'border-destructive/40 bg-destructive/5 p-4' : 'p-4'}>
          <div className="text-xs text-muted-foreground">Доступно</div>
          <div className={available < 0 ? 'mt-1 text-lg font-semibold text-destructive' : 'mt-1 text-lg font-semibold'}>
            <Money amount={available} />
          </div>
        </Card>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Сделки, занимающие резерв</h2>
        {occupying.length === 0 ? (
          <p className="text-sm text-muted-foreground">Сейчас нет сделок, занимающих резерв гарантии.</p>
        ) : (
          <div className="grid gap-2">
            {occupying.map(({ deal, paidOut }) => (
              <Card key={deal.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">{deal.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Сумма сделки {formatMoney(deal.amount)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Выплачено {formatMoney(paidOut)}</span>
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
