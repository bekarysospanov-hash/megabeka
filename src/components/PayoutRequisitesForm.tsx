import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDemoActions, useDemoState } from '../store/DemoProvider'

const BANKS = ['Kaspi Bank', 'Halyk Bank', 'Bank CenterCredit', 'Forte Bank', 'Jusan Bank']

export function PayoutRequisitesForm({ onSaved }: { onSaved?: () => void }) {
  const { payoutRequisites } = useDemoState()
  const { setPayoutRequisites } = useDemoActions()
  const [bankName, setBankName] = useState(payoutRequisites?.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState(payoutRequisites?.accountNumber ?? '')

  const canSave = bankName.trim().length > 0 && accountNumber.replace(/\s/g, '').length >= 12

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="payout-bank">Банк</Label>
        <Select value={bankName} onValueChange={setBankName}>
          <SelectTrigger id="payout-bank">
            <SelectValue placeholder="Выберите банк" />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="payout-account">Расчётный счёт (IBAN)</Label>
        <Input
          id="payout-account"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="KZ00 0000 0000 0000 0000"
        />
      </div>
      <Button
        disabled={!canSave}
        className="w-fit"
        onClick={() => {
          setPayoutRequisites(bankName.trim(), accountNumber.trim())
          onSaved?.()
        }}
      >
        {payoutRequisites ? 'Сохранить изменения' : 'Сохранить реквизиты'}
      </Button>
    </div>
  )
}
