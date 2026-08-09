import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateAvailableBalance } from '../domain/balance'
import { formatDateTime, formatMoney } from '../domain/statusLabels'
import { useDemoActions } from '../store/DemoProvider'
import type { Transaction, TransferRequest } from '../domain/types'

export function DealBalance({
  dealId,
  transactions,
  transferRequests,
}: {
  dealId: string
  transactions: Transaction[]
  transferRequests: TransferRequest[]
}) {
  const { requestTransfer } = useDemoActions()
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')

  const available = calculateAvailableBalance(dealId, transactions, transferRequests)
  const amountValue = Number(amount)
  const canRequest = amountValue > 0 && amountValue <= available && purpose.trim().length > 0

  if (transactions.length === 0) return null

  return (
    <section className="grid gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Баланс на счету Asia Mebel</h2>
        <span className="text-lg font-semibold">{formatMoney(available)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Деньги от клиента поступают на счёт платформы. Запросите перевод под конкретную цель, например
        закуп материалов — остальное останется доступным для следующих запросов.
      </p>

      <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="transfer-amount">Сумма, ₸</Label>
          <Input
            id="transfer-amount"
            type="number"
            min={0}
            max={available}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="transfer-purpose">Цель</Label>
          <Input
            id="transfer-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Например, закуп материалов"
          />
        </div>
        <Button
          disabled={!canRequest}
          onClick={() => {
            requestTransfer(dealId, amountValue, purpose.trim())
            setAmount('')
            setPurpose('')
          }}
        >
          Запросить перевод
        </Button>
      </div>

      {transferRequests.length > 0 && (
        <div className="grid gap-1.5 border-t pt-3">
          <h3 className="text-xs font-semibold text-muted-foreground">Запрошенные переводы</h3>
          {transferRequests.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span>
                {r.purpose} <span className="text-muted-foreground">· {formatDateTime(r.requestedAt)}</span>
              </span>
              <span className="font-medium">{formatMoney(r.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
