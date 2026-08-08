import { Button } from '@/components/ui/button'
import type { Deal, DisputeLog } from '../domain/types'

const OPENED_BY_LABELS: Record<string, string> = {
  client: 'клиент',
  furniture_maker: 'мебельщик',
  operator: 'оператор',
}

export function DisputePanel({
  deal,
  disputes,
  onFreeze,
  onRefund,
  onResolve,
}: {
  deal: Deal
  disputes: DisputeLog[]
  onFreeze?: () => void
  onRefund?: () => void
  onResolve?: () => void
}) {
  if (deal.status !== 'dispute_open') return null

  const openDispute = [...disputes].reverse().find((d) => d.status === 'open')

  return (
    <div className="grid gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="font-semibold text-destructive">Открыт спор</div>
      {openDispute && (
        <div className="text-sm">
          Инициатор: {OPENED_BY_LABELS[openDispute.openedBy] ?? openDispute.openedBy}
          <br />
          Причина: «{openDispute.reason}»
        </div>
      )}
      {deal.frozen && <div className="text-sm font-semibold">Сделка заморожена оператором.</div>}
      {(onFreeze || onRefund || onResolve) && (
        <div className="flex flex-wrap gap-2">
          {onFreeze && !deal.frozen && (
            <Button variant="outline" size="sm" onClick={onFreeze}>
              Заморозить
            </Button>
          )}
          {onRefund && (
            <Button variant="outline" size="sm" onClick={onRefund}>
              Инициировать возврат
            </Button>
          )}
          {onResolve && (
            <Button variant="outline" size="sm" onClick={onResolve}>
              Пометить спор решённым
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
