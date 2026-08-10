import { formatDateTime, formatMoney } from '../domain/statusLabels'
import type { Transaction } from '../domain/types'

const TYPE_LABELS: Record<Transaction['type'], string> = {
  prepayment: 'Предоплата',
  final: 'Финальный платёж',
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">Поступлений пока не было.</p>
  }

  return (
    <ul className="grid gap-2">
      {transactions.map((t, i) => (
        <li key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
          <div>
            <div className="font-semibold">{TYPE_LABELS[t.type]}</div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(t.paidAt)} · поступило на счёт платформы
            </div>
          </div>
          <div className="font-semibold">{formatMoney(t.amount)}</div>
        </li>
      ))}
    </ul>
  )
}
