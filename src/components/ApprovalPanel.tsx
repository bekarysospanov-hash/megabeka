import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Money } from './Money'
import { useDemoActions } from '../store/DemoProvider'
import { DEAL_AMOUNT_LIMIT } from '../domain/dealLimits'
import { dealRiskAmount } from '../domain/guaranteeReserve'
import type { Deal } from '../domain/types'

/**
 * Одобрение сверхлимитной сделки оператором (FR-44). Сумма выше лимита не запрещена — она
 * требует ручного решения, потому что именно такие сделки съедают резерв гарантии быстрее
 * всего. Отказ обязательно с комментарием: без него мебельщик не поймёт, что менять.
 */
export function ApprovalPanel({ deal }: { deal: Deal }) {
  const { approveDeal, rejectApproval } = useDemoActions()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  if (deal.status !== 'pending_approval') return null

  return (
    <div className="grid gap-3 border border-warning/40 bg-wait-soft p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-warning">
        Требуется одобрение
      </div>

      <p className="text-sm">
        Сумма сделки <Money amount={deal.amount} className="font-semibold" /> выше лимита{' '}
        <Money amount={DEAL_AMOUNT_LIMIT} />, при котором отправка идёт без проверки. Платформа
        возьмёт на себя риск <Money amount={dealRiskAmount(deal)} className="font-semibold" /> — это
        доля, уходящая мебельщику до приёмки.
      </p>

      {!rejecting ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => approveDeal(deal.id)}>
            Одобрить и отправить клиенту
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
            Отклонить
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Почему отказ: сумма выше согласованного потолка…"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!reason.trim()}
              onClick={() => {
                rejectApproval(deal.id, reason)
                setRejecting(false)
              }}
            >
              Отклонить с причиной
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(false)}>
              Отмена
            </Button>
          </div>
          {!reason.trim() && (
            <p className="text-xs text-muted-foreground">
              Без причины мебельщик не поймёт, что менять в сделке.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
