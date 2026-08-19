import { Link } from 'react-router-dom'
import { BackLink } from '../components/BackLink'
import { DealBalance } from '../components/DealBalance'
import { calculateTotalBalance } from '../domain/balance'

import { useDemoState } from '../store/DemoProvider'
import { Money } from '../components/Money'

export function FurnitureMakerBalance() {
  const { deals, transactions, transferRequests, payoutRequisites } = useDemoState()

  const dealsWithMoney = Object.values(deals).filter((deal) =>
    transactions.some((t) => t.dealId === deal.id),
  )
  const total = calculateTotalBalance(dealsWithMoney, transactions, transferRequests)

  return (
    <div className="grid gap-6 pb-10">
      <BackLink to="/furniture-maker" label="Мои сделки" />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Баланс</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Деньги от клиентов по всем сделкам, доступные к запросу перевода.
        </p>
      </div>

      <div className="rounded-lg border p-5">
        <div className="text-xs text-muted-foreground">Общий доступный баланс</div>
        <div className="text-2xl font-semibold"><Money amount={total} /></div>
      </div>

      {!payoutRequisites && dealsWithMoney.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
          Реквизиты для выплат ещё не указаны — добавьте их на странице{' '}
          <Link to="/furniture-maker/verification" className="underline">
            «Безопасная сделка»
          </Link>
          , чтобы запрашивать переводы.
        </div>
      )}

      {dealsWithMoney.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока нет сделок с поступившими деньгами.</p>
      ) : (
        <div className="grid gap-4">
          {dealsWithMoney.map((deal) => (
            <div key={deal.id} className="grid gap-2">
              <Link to={`/furniture-maker/deal/${deal.id}`} className="text-sm font-semibold underline">
                {deal.title}
              </Link>
              <DealBalance
                dealId={deal.id}
                dealAmount={deal.amount}
                transactions={transactions.filter((t) => t.dealId === deal.id)}
                transferRequests={transferRequests.filter((r) => r.dealId === deal.id)}
                payoutRequisites={payoutRequisites}
                showRequisitesPrompt={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
