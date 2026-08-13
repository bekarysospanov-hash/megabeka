import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DemoModeBanner } from './DemoModeBanner'
import { formatMoney } from '../domain/statusLabels'

type PaymentStep = 'redirecting' | 'acquiring' | 'returning' | 'error'

const REDIRECT_DELAY_MS = 900
const RETURN_DELAY_MS = 700

// Имитация редиректа на сторону эквайринга при оплате картой — тот же паттерн, что и у
// TrustMe.kz в SignDocumentDialog.tsx (демо-редирект → брендированный экран → возврат).
// PayGate.kz — вымышленный бренд, не привязан к реальному эквайрингу.
export function AcquiringPaymentDialog({
  amount,
  triggerLabel,
  onSubmit,
}: {
  amount: number
  triggerLabel: string
  onSubmit: () => void
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<PaymentStep>('redirecting')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  useEffect(() => {
    if (!open || step !== 'redirecting') return
    const timer = setTimeout(() => setStep('acquiring'), REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [open, step])

  useEffect(() => {
    if (!open || step !== 'returning') return
    const timer = setTimeout(() => {
      try {
        onSubmit()
        setOpen(false)
      } catch (err) {
        // Статус сделки мог измениться, пока диалог был открыт (например, эскалация оператором) —
        // показываем причину вместо тихого закрытия, не даём исключению всплыть выше React-дерева.
        console.error('Не удалось провести оплату:', err)
        setStep('error')
      }
    }, RETURN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [open, step, onSubmit])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setStep('redirecting')
          setCardNumber('')
          setExpiry('')
          setCvv('')
        }
      }}
    >
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0">
        {step === 'redirecting' && <RedirectingScreen />}
        {step === 'acquiring' && (
          <AcquiringScreen
            amount={amount}
            cardNumber={cardNumber}
            onCardNumberChange={setCardNumber}
            expiry={expiry}
            onExpiryChange={setExpiry}
            cvv={cvv}
            onCvvChange={setCvv}
            onSubmit={() => setStep('returning')}
          />
        )}
        {step === 'returning' && <ReturningScreen />}
        {step === 'error' && <ErrorScreen />}
      </DialogContent>
    </Dialog>
  )
}

function RedirectingScreen() {
  return (
    <div className="grid place-items-center gap-3 px-6 py-16 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <DialogTitle className="text-sm font-medium text-muted-foreground">Переходим на страницу оплаты…</DialogTitle>
    </div>
  )
}

function ReturningScreen() {
  return (
    <div className="grid place-items-center gap-3 px-6 py-16 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <DialogTitle className="text-sm font-medium text-muted-foreground">Возврат в Asia Mebel…</DialogTitle>
    </div>
  )
}

function ErrorScreen() {
  return (
    <div className="grid place-items-center gap-3 px-6 py-16 text-center">
      <DialogTitle className="text-sm font-medium text-destructive">Не удалось провести оплату</DialogTitle>
      <p className="max-w-xs text-sm text-muted-foreground">
        Статус сделки изменился, пока было открыто окно оплаты. Закройте окно и обновите страницу сделки.
      </p>
      <DialogClose asChild>
        <Button variant="outline" size="sm">
          Закрыть
        </Button>
      </DialogClose>
    </div>
  )
}

function AcquiringScreen({
  amount,
  cardNumber,
  onCardNumberChange,
  expiry,
  onExpiryChange,
  cvv,
  onCvvChange,
  onSubmit,
}: {
  amount: number
  cardNumber: string
  onCardNumberChange: (value: string) => void
  expiry: string
  onExpiryChange: (value: string) => void
  cvv: string
  onCvvChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="grid max-h-[85vh] grid-rows-[auto_1fr_auto]">
      <div className="flex items-center gap-2 border-b bg-blue-900 px-5 py-3 text-white">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-[10px] font-bold text-blue-900">
          PG
        </div>
        <span className="text-sm font-semibold">paygate.kz</span>
        <span className="ml-auto rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
          Демо-имитация
        </span>
      </div>
      <div className="overflow-y-auto px-6 py-4">
        <DialogHeader>
          <DialogTitle>Оплата заказа</DialogTitle>
        </DialogHeader>
        <p className="mt-2 text-sm text-muted-foreground">Сумма к оплате: {formatMoney(amount)}</p>
        <div className="mt-3 grid gap-2">
          <Input placeholder="Номер карты" value={cardNumber} onChange={(e) => onCardNumberChange(e.target.value)} />
          <div className="flex gap-2">
            <Input placeholder="ММ/ГГ" value={expiry} onChange={(e) => onExpiryChange(e.target.value)} className="w-24" />
            <Input placeholder="CVV" value={cvv} onChange={(e) => onCvvChange(e.target.value)} className="w-20" />
          </div>
        </div>
      </div>
      <DialogFooter className="flex-col items-stretch gap-3 border-t px-6 py-4 sm:flex-col sm:items-stretch">
        <DemoModeBanner>
          Оплата через PayGate.kz имитируется — реального обращения к эквайрингу нет, подойдёт любая карта.
        </DemoModeBanner>
        <Button disabled={cardNumber.trim().length < 4} onClick={onSubmit}>
          Оплатить {formatMoney(amount)}
        </Button>
        <DialogClose asChild>
          <Button variant="ghost" size="sm" className="w-fit">
            Отмена
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  )
}
