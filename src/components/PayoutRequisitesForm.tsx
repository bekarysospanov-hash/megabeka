import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDemoActions, useDemoState } from '../store/DemoProvider'

export function PayoutRequisitesForm({ onSaved }: { onSaved?: () => void }) {
  const { payoutRequisites } = useDemoState()
  const { setPayoutRequisites } = useDemoActions()
  const [cardNumber, setCardNumber] = useState(payoutRequisites?.cardNumber ?? '')
  const [holderName, setHolderName] = useState(payoutRequisites?.holderName ?? '')

  const canSave = cardNumber.replace(/\s/g, '').length >= 12 && holderName.trim().length >= 2

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="payout-card">Номер карты</Label>
        <Input
          id="payout-card"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="0000 0000 0000 0000"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="payout-holder">Имя держателя карты</Label>
        <Input
          id="payout-holder"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          placeholder="Как на карте"
        />
      </div>
      <Button
        disabled={!canSave}
        className="w-fit"
        onClick={() => {
          setPayoutRequisites(cardNumber.trim(), holderName.trim())
          onSaved?.()
        }}
      >
        {payoutRequisites ? 'Сохранить изменения' : 'Сохранить реквизиты'}
      </Button>
    </div>
  )
}
