import { Card } from '@/components/ui/card'
import { StatusBadge } from '../components/StatusBadge'
import { useDemoState } from '../store/DemoProvider'
import { calculateGuaranteeReserve, dealRiskAmount, dealsOccupyingReserve } from '../domain/guaranteeReserve'
import { formatMoney } from '../domain/statusLabels'
import { Money } from '../components/Money'

export function OperatorGuaranteeReserve() {
  const { deals, transactions } = useDemoState()
  const dealList = Object.values(deals)
  // Резерв занимает риск по каждой активной сделке, а не только уже выплаченное: обязательство
  // возникает в момент отправки клиенту, и оператор должен видеть его сразу, а не постфактум.
  const occupying = dealsOccupyingReserve(dealList).map((deal) => {
    const paidOut = transactions
      .filter((t) => t.dealId === deal.id)
      .reduce((sum, t) => sum + t.amount, 0)
    return { deal, paidOut, risk: Math.max(dealRiskAmount(deal), paidOut) }
  })
  const { limit, used, available } = calculateGuaranteeReserve(dealList, transactions)

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Резерв гарантии</h1>
      <p className="text-sm text-muted-foreground">
        Покрытие гарантии Asia Mebel. Занятая часть — то, что платформа обязана возместить из
        собственных денег, если сделки закончатся полным возвратом: доля, уходящая мебельщику до
        приёмки. Обязательство считается с момента отправки сделки клиенту, а не с первой выплаты.
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
            {occupying.map(({ deal, paidOut, risk }) => (
              <Card key={deal.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">{deal.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Сумма сделки {formatMoney(deal.amount)} · выплачено {formatMoney(paidOut)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Под риском {formatMoney(risk)}</span>
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
