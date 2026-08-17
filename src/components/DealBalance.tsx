import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PayoutRequisitesDialog } from './PayoutRequisitesDialog'
import { calculateAvailableBalance } from '../domain/balance'
import { formatDateTime, formatMoney, maskAccountNumber } from '../domain/statusLabels'
import { useDemoActions } from '../store/DemoProvider'
import type { PayoutRequisites, Transaction, TransferRequest } from '../domain/types'

export function DealBalance({
  dealId,
  dealAmount,
  transactions,
  transferRequests,
  payoutRequisites,
  showRequisitesPrompt = true,
}: {
  dealId: string
  dealAmount: number
  transactions: Transaction[]
  transferRequests: TransferRequest[]
  payoutRequisites: PayoutRequisites | null
  showRequisitesPrompt?: boolean
}) {
  const { requestTransfer } = useDemoActions()
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')

  const available = calculateAvailableBalance(dealId, transactions, transferRequests)
  const amountValue = Number(amount)
  const canRequest = amountValue > 0 && amountValue <= available && purpose.trim().length > 0

  const requestProblems: string[] = []
  if (amountValue <= 0) requestProblems.push('сумму больше нуля')
  else if (amountValue > available) requestProblems.push(`сумму не больше доступного баланса (${formatMoney(available)})`)
  if (purpose.trim().length === 0) requestProblems.push('цель перевода')

  return (
    <section className="grid gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Получено от клиента (всего)</span>
        <span className="font-medium text-foreground">{formatMoney(dealAmount)}</span>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Доступно к запросу перевода
          {payoutRequisites && (
            <span className="ml-2 font-normal text-muted-foreground">
              · {payoutRequisites.bankName}, счёт {maskAccountNumber(payoutRequisites.accountNumber)}
            </span>
          )}
        </h2>
        <span className="text-lg font-semibold">{formatMoney(available)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Вся сумма от клиента удерживается платформой и раскрывается вам траншами. Запросите перевод под
        конкретную цель, например закуп материалов — остальное останется доступным для следующих запросов.
      </p>

      {payoutRequisites ? (
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
          {requestProblems.length > 0 && (amount || purpose) && (
            <p className="col-span-full text-xs text-warning">Укажите {requestProblems.join(' и ')}.</p>
          )}
        </div>
      ) : (
        showRequisitesPrompt && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
            <span>Укажите реквизиты, чтобы запрашивать переводы на счёт.</span>
            <PayoutRequisitesDialog triggerLabel="Добавить реквизиты" />
          </div>
        )
      )}

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
