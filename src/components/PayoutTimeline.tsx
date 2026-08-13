import { cn } from '@/lib/utils'
import { formatDateTime, formatMoney } from '../domain/statusLabels'
import type { Deal, Transaction } from '../domain/types'

function MilestoneDot({ done }: { done: boolean }) {
  return (
    <div
      className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', done ? 'bg-success' : 'bg-muted-foreground/30')}
      aria-hidden
    />
  )
}

export function PayoutTimeline({ deal, transactions }: { deal: Deal; transactions: Transaction[] }) {
  const prepayment = transactions.find((t) => t.type === 'prepayment')
  const interim = transactions.find((t) => t.type === 'interim')
  const final = transactions.find((t) => t.type === 'final')

  return (
    <div className="grid gap-2">
      <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
        <MilestoneDot done={Boolean(prepayment)} />
        <div>
          <div className="font-medium">
            {deal.interimPercent > 0 ? 'Аванс' : 'Предоплата'} ({deal.prepaymentPercent}%)
          </div>
          <div className="text-muted-foreground">
            {prepayment
              ? `${formatMoney(prepayment.amount)} · ${formatDateTime(prepayment.paidAt)}`
              : 'Поступит после подписания договора обеими сторонами'}
          </div>
        </div>
      </div>

      {deal.interimPercent > 0 && (
        <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <MilestoneDot done={Boolean(interim)} />
          <div>
            <div className="font-medium">Промежуточный транш ({deal.interimPercent}%)</div>
            <div className="text-muted-foreground">
              {interim
                ? `${formatMoney(interim.amount)} · ${formatDateTime(interim.paidAt)}`
                : 'Мебельщик запрашивает доступность в любой момент во время производства'}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
        <MilestoneDot done={Boolean(prepayment)} />
        <div className="flex-1">
          <div className="font-medium">Деньги на счету</div>
          <div className="text-muted-foreground">
            {prepayment
              ? 'Доступны к запросу — см. раздел «Баланс» ниже'
              : 'Появятся после поступления предоплаты'}
          </div>
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
