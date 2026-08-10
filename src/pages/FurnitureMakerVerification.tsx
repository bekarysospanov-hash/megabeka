import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackLink } from '../components/BackLink'
import { PayoutRequisitesForm } from '../components/PayoutRequisitesForm'
import { formatDate, maskCard } from '../domain/statusLabels'
import { useDemoActions, useDemoState } from '../store/DemoProvider'

export function FurnitureMakerVerification() {
  const { furnitureMakerVerification, payoutRequisites } = useDemoState()
  const { setFurnitureMakerVerification } = useDemoActions()

  const [companyName, setCompanyName] = useState(furnitureMakerVerification?.companyName ?? '')
  const [businessId, setBusinessId] = useState(furnitureMakerVerification?.businessId ?? '')
  const [legalAddress, setLegalAddress] = useState(furnitureMakerVerification?.legalAddress ?? '')

  const canSave = companyName.trim().length > 0 && businessId.trim().length > 0

  return (
    <div className="grid gap-6">
      <BackLink to="/furniture-maker" label="Мои сделки" />

      <div>
        <h1 className="text-xl font-semibold tracking-tight">Безопасная сделка от Asia Mebel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Asia Mebel держит деньги клиента под защитой до подписания акта приёма-передачи и гарантирует
          вам выплату при выполнении условий сделки. Подписание договора и акта проходит через TrustMe.kz,
          весь путь сделки виден обеим сторонам в реальном времени.
        </p>
      </div>

      {furnitureMakerVerification && (
        <div className="rounded-md border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
          Верифицировано {formatDate(furnitureMakerVerification.verifiedAt)}
        </div>
      )}

      <section className="grid gap-3 rounded-lg border p-5">
        <h2 className="text-sm font-semibold">Данные компании</h2>
        {/* Допущение: стандартные для пилота реквизиты юр. лица в Казахстане — без реальной проверки на этом этапе. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="verify-company">Название компании / ИП</Label>
            <Input id="verify-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="verify-business-id">БИН / ИИН</Label>
            <Input id="verify-business-id" value={businessId} onChange={(e) => setBusinessId(e.target.value)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="verify-address">Юридический адрес</Label>
            <Input
              id="verify-address"
              value={legalAddress}
              onChange={(e) => setLegalAddress(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
        </div>
        <Button
          disabled={!canSave}
          className="w-fit"
          onClick={() =>
            setFurnitureMakerVerification(companyName.trim(), businessId.trim(), legalAddress.trim())
          }
        >
          {furnitureMakerVerification ? 'Сохранить изменения' : 'Верифицировать компанию'}
        </Button>
      </section>

      <section className="grid gap-3 rounded-lg border p-5">
        <h2 className="text-sm font-semibold">Реквизиты для выплат</h2>
        {payoutRequisites && (
          <div className="rounded-md border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
            Сейчас выплаты идут на карту {maskCard(payoutRequisites.cardNumber)} ({payoutRequisites.holderName})
          </div>
        )}
        <div className="max-w-sm">
          <PayoutRequisitesForm />
        </div>
      </section>
    </div>
  )
}
