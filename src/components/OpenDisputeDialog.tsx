import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useDemoActions } from '../store/DemoProvider'
import type { DisputeLog } from '../domain/types'
import { cn } from '@/lib/utils'

/**
 * Перечень причин задан FR-24 и закрыт: свободную причину арбитр не сможет сопоставить
 * с пунктом спецификации, а спецификация — единственное основание для его решения.
 */
const REASONS = [
  'Не соответствует спецификации',
  'Брак',
  'Некомплект',
  'Нарушен срок',
  'Работы не ведутся',
] as const

/**
 * Открытие спора. Замораживает выплаты и запускает разбор, поэтому действие тяжёлое:
 * подтверждение диалогом, причина обязательна.
 *
 * Подтверждения одноразовым кодом (FR-43) в прототипе нет сознательно — SMS-контур в демо
 * не воспроизводится, см. корзину «не тащим в прототип» в docs/AUDIT-prototype-vs-prd.md.
 */
export function OpenDisputeDialog({ dealId, actor }: { dealId: string; actor: DisputeLog['openedBy'] }) {
  const { callOperator } = useDemoActions()
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')

  const fullReason = reason && details.trim() ? `${reason}: ${details.trim()}` : reason

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Сообщить о проблеме
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Сообщить о проблеме</AlertDialogTitle>
          <AlertDialogDescription>
            Разбор ведёт оператор платформы. Пока идёт разбор, деньги на защищённом счёте не
            двигаются — производитель ничего не получит до решения.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>В чём проблема</Label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setReason(option)}
                  className={cn(
                    'border px-3 py-1.5 text-xs font-medium transition-colors',
                    reason === option
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dispute-details">Опишите подробнее</Label>
            <Textarea
              id="dispute-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Например: скол на левом фасаде, не закрывается верхний ящик"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <Button disabled={!reason} onClick={() => reason && callOperator(dealId, actor, fullReason)}>
            Открыть разбор
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
