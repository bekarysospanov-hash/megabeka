import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackLink } from '../components/BackLink'
import { DealSpecForm } from '../components/DealSpecForm'
import { dealToSpecInput } from '../domain/dealMachine'
import { useDeal, useDemoActions } from '../store/DemoProvider'
import type { DealSpecInput } from '../domain/types'

export function FurnitureMakerEditDeal() {
  const { id } = useParams<{ id: string }>()
  const deal = useDeal(id)
  const { updateDeal } = useDemoActions()
  const navigate = useNavigate()

  if (!deal || deal.status !== 'draft') {
    return <Navigate to={deal ? `/furniture-maker/deal/${deal.id}` : '/furniture-maker'} replace />
  }

  const draftDeal = deal

  function handleSubmit(input: DealSpecInput) {
    updateDeal(draftDeal.id, input)
    navigate(`/furniture-maker/deal/${draftDeal.id}`)
  }

  return (
    <div className="grid gap-6 pb-10">
      <BackLink to={`/furniture-maker/deal/${deal.id}`} label="Назад к сделке" />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Редактирование сделки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Пока сделка в черновике, можно поправить любые условия до отправки клиенту.
        </p>
      </div>

      <DealSpecForm
        key={deal.id}
        initial={dealToSpecInput(deal)}
        submitLabel="Сохранить изменения"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
