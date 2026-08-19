import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDemoActions, useDemoState } from '../store/DemoProvider'
import { pendingTransferRequests } from '../domain/transfers'
import { formatDateTime, formatMoney, maskAccountNumber } from '../domain/statusLabels'
import { Money } from './Money'

/**
 * FR-35: невыплаченные транши — задача оператора, а не запись, которую никто не видит.
 * Очередь сортируется по давности запроса: чем дольше мебельщик ждёт деньги, тем выше строка.
 */
export function TransferRequestQueue() {
  const { transferRequests, deals, payoutRequisites } = useDemoState()
  const { executeTransfer, rejectTransfer } = useDemoActions()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const queue = pendingTransferRequests(transferRequests).sort((a, b) =>
    a.requestedAt.localeCompare(b.requestedAt),
  )

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold">Запросы на перевод</h2>

      {queue.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">
          Невыплаченных траншей нет: все запросы мебельщиков закрыты.
        </Card>
      ) : (
        <div className="grid gap-3">
          {queue.map((request) => {
            const deal = deals[request.dealId]
            const isRejecting = rejectingId === request.id
            const isConfirming = confirmingId === request.id

            return (
              <Card key={request.id} className="border-warning/40 bg-warning/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <Link
                      to={`/operator/deal/${request.dealId}`}
                      className="font-semibold underline-offset-4 hover:underline"
                    >
                      {deal?.title ?? 'Сделка удалена'}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {request.purpose} · запрошен {formatDateTime(request.requestedAt)}
                    </div>
                    {payoutRequisites && (
                      <div className="text-xs text-muted-foreground">
                        {payoutRequisites.bankName}, счёт {maskAccountNumber(payoutRequisites.accountNumber)}
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-semibold">
                    <Money amount={request.amount} />
                  </div>
                </div>

                {!payoutRequisites && (
                  <p className="mt-2.5 text-xs text-warning">
                    Реквизиты для выплаты не указаны — перевести деньги некуда.
                  </p>
                )}

                {!isRejecting && !isConfirming && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!payoutRequisites}
                      onClick={() => setConfirmingId(request.id)}
                    >
                      Исполнить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectingId(request.id)
                        setReason('')
                      }}
                    >
                      Отклонить
                    </Button>
                  </div>
                )}

                {/* Отметка об исполнении необратима, а сам перевод оператор делает в банке вне
                    системы: без второго шага легко закрыть запрос, деньги по которому не ушли. */}
                {isConfirming && (
                  <div className="mt-2.5 grid gap-2">
                    {/* Внутри связного предложения сумма набирается обычным текстом:
                        моноширинные табличные цифры — для отдельно стоящих сумм. */}
                    <p className="text-sm">
                      Подтвердите, что перевод {formatMoney(request.amount)} уже отправлен на счёт
                      мебельщика. Отменить отметку будет нельзя.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          executeTransfer(request.id)
                          setConfirmingId(null)
                        }}
                      >
                        Деньги отправлены
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                )}

                {isRejecting && (
                  <div className="mt-2.5 grid gap-2">
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Почему отказ: реквизиты не совпадают с ИП…"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={!reason.trim()}
                        onClick={() => {
                          rejectTransfer(request.id, reason)
                          setRejectingId(null)
                        }}
                      >
                        Отклонить с причиной
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>
                        Отмена
                      </Button>
                    </div>
                    {!reason.trim() && (
                      <p className="text-xs text-muted-foreground">
                        Сумма вернётся в доступный баланс сделки. Без причины мебельщик не поймёт,
                        что исправить перед новым запросом.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
