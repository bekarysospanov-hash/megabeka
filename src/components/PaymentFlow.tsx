import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { DemoModeBanner } from './DemoModeBanner'
import { formatMoney } from '../domain/statusLabels'
import type { PaymentMethod } from '../domain/types'

const BANKS = ['Kaspi Bank', 'Halyk Bank', 'Bank CenterCredit']

export function PaymentMethodPicker({
  amount,
  onSubmit,
}: {
  amount: number
  onSubmit: (method: PaymentMethod) => void
}) {
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [bank, setBank] = useState<string | null>(null)

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <Button variant={method === 'card' ? 'default' : 'outline'} onClick={() => setMethod('card')}>
          Картой
        </Button>
        <Button variant={method === 'bank' ? 'default' : 'outline'} onClick={() => setMethod('bank')}>
          Через банк
        </Button>
      </div>

      {method === 'card' && (
        <div className="grid gap-2 rounded-lg border p-4">
          <Input placeholder="Номер карты" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
          <div className="flex gap-2">
            <Input placeholder="ММ/ГГ" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-24" />
            <Input placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-20" />
          </div>
          <Button disabled={cardNumber.trim().length < 4} onClick={() => onSubmit('card')} className="w-fit">
            Оплатить {formatMoney(amount)}
          </Button>
        </div>
      )}

      {method === 'bank' && (
        <div className="grid gap-3 rounded-lg border p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {BANKS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBank(b)}
                className={cn(
                  'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                  bank === b
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:border-primary/40 hover:bg-accent/40',
                )}
              >
                {b}
              </button>
            ))}
          </div>
          <Button disabled={!bank} onClick={() => onSubmit('bank')} className="w-fit">
            Перейти в приложение банка
          </Button>
        </div>
      )}
    </div>
  )
}

export function PaymentProcessing({ method, onConfirm }: { method: PaymentMethod | null; onConfirm: () => void }) {
  return (
    <div className="grid gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {method === 'bank' ? 'Ожидаем подтверждения от банка…' : 'Обрабатываем платёж…'}
      </div>
      <DemoModeBanner>
        В реальности подтверждение приходит автоматически из банка/эквайринга — здесь эмулируем кнопкой.
      </DemoModeBanner>
      <Button variant="outline" onClick={onConfirm} className="w-fit">
        Демо: подтвердить оплату
      </Button>
    </div>
  )
}
