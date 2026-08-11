import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackLink } from '../components/BackLink'
import { PayoutRequisitesForm } from '../components/PayoutRequisitesForm'
import { GUARANTEE_RESERVE_LIMIT } from '../domain/guaranteeReserve'
import { formatDate, formatMoney, maskAccountNumber } from '../domain/statusLabels'
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

      <section className="grid gap-2 rounded-lg border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold">Как работает гарантия</h2>
        </div>
        <ul className="grid gap-1.5 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Клиенту</span> — деньги хранятся на счёте
            платформы и выплачиваются вам только после подписания акта. Если сделка не исполнена,
            Asia Mebel возвращает клиенту оплату.
          </li>
          <li>
            <span className="font-medium text-foreground">Вам</span> — как только клиент оплатил, деньги
            гарантированно ваши: Asia Mebel не может отдать их обратно клиенту без вашего согласия, кроме
            случаев спора, решённого оператором.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Общий лимит покрытия гарантии на площадку — {formatMoney(GUARANTEE_RESERVE_LIMIT)}. Пока идут
          активные сделки на эту сумму, новые сделки сверх лимита временно недоступны для отправки клиенту.
        </p>
      </section>

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
            Переводы по вашему запросу будут приходить в {payoutRequisites.bankName}, счёт{' '}
            {maskAccountNumber(payoutRequisites.accountNumber)}
          </div>
        )}
        <div className="max-w-sm">
          <PayoutRequisitesForm />
        </div>
      </section>
    </div>
  )
}
