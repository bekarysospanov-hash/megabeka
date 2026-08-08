import { BackLink } from '../components/BackLink'
import { PayoutRequisitesForm } from '../components/PayoutRequisitesForm'
import { useDemoState } from '../store/DemoProvider'
import { maskCard } from '../domain/statusLabels'

export function FurnitureMakerProfile() {
  const { payoutRequisites } = useDemoState()

  return (
    <div className="grid gap-6">
      <BackLink to="/furniture-maker" label="Мои сделки" />
      <h1 className="text-xl font-semibold tracking-tight">Реквизиты для выплат</h1>
      <p className="text-sm text-muted-foreground">
        Сюда платформа переводит предоплату и финальный платёж по вашим сделкам.
      </p>

      {payoutRequisites && (
        <div className="rounded-md border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
          Сейчас выплаты идут на карту {maskCard(payoutRequisites.cardNumber)} ({payoutRequisites.holderName})
        </div>
      )}

      <div className="max-w-sm">
        <PayoutRequisitesForm />
      </div>
    </div>
  )
}
