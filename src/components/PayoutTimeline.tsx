import { cn } from '@/lib/utils'
import { PayoutRequisitesDialog } from './PayoutRequisitesDialog'
import { formatDateTime, formatMoney, maskCard } from '../domain/statusLabels'
import type { Deal, PayoutRequisites, Transaction } from '../domain/types'

function MilestoneDot({ done }: { done: boolean }) {
  return (
    <div
      className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', done ? 'bg-success' : 'bg-muted-foreground/30')}
      aria-hidden
    />
  )
}

export function PayoutTimeline({
  deal,
  transactions,
  payoutRequisites,
}: {
  deal: Deal
  transactions: Transaction[]
  payoutRequisites: PayoutRequisites | null
}) {
  const prepayment = transactions.find((t) => t.type === 'prepayment')
  const final = transactions.find((t) => t.type === 'final')

  return (
    <div className="grid gap-2">
      <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
        <MilestoneDot done={Boolean(prepayment)} />
        <div>
          <div className="font-medium">Предоплата ({deal.prepaymentPercent}%)</div>
          <div className="text-muted-foreground">
            {prepayment
              ? `${formatMoney(prepayment.amount)} · ${formatDateTime(prepayment.paidAt)}`
              : 'Поступит после подписания договора обеими сторонами'}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
        <MilestoneDot done={Boolean(prepayment) && Boolean(payoutRequisites)} />
        <div className="flex-1">
          <div className="font-medium">Доступно к получению</div>
          {!prepayment && <div className="text-muted-foreground">Появится после поступления предоплаты</div>}
          {prepayment && payoutRequisites && (
            <div className="text-muted-foreground">Переведено на карту {maskCard(payoutRequisites.cardNumber)}</div>
          )}
          {prepayment && !payoutRequisites && (
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-warning">Укажите реквизиты, чтобы получить деньги</span>
              <PayoutRequisitesDialog triggerLabel="Добавить реквизиты" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
        <MilestoneDot done={Boolean(final)} />
        <div>
          <div className="font-medium">Финальный платёж ({deal.finalPercent}%)</div>
          <div className="text-muted-foreground">
            {final
              ? `${formatMoney(final.amount)} · ${formatDateTime(final.paidAt)}`
              : 'Поступит после подписания акта приёма-передачи обеими сторонами'}
          </div>
        </div>
      </div>
    </div>
  )
}
