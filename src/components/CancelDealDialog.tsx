import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDemoActions } from '../store/DemoProvider'
import type { Actor } from '../domain/types'

// Лёгкая отмена до оплаты — деньги ещё не двигались, поэтому это не эскалация оператору
// и не формальный спор, в отличие от callOperator/initiateRefund.
export function CancelDealDialog({
  dealId,
  actor,
  triggerLabel,
}: {
  dealId: string
  actor: Actor
  triggerLabel: string
}) {
  const { cancelDeal } = useDemoActions()
  const [reason, setReason] = useState('')

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Отменить сделку?</AlertDialogTitle>
          <AlertDialogDescription>
            Деньги по сделке ещё не поступали, поэтому отмена сразу закроет её — возвращать нечего.
            Вторая сторона и оператор получат уведомление.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="cancel-reason">Причина (необязательно)</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Например: клиент передумал / не можем изготовить в срок"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Не отменять</AlertDialogCancel>
          <AlertDialogAction onClick={() => cancelDeal(dealId, actor, reason)}>
            Отменить сделку
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
