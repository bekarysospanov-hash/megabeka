import { useNavigate } from 'react-router-dom'
import { BackLink } from '../components/BackLink'
import { DealSpecForm } from '../components/DealSpecForm'
import { generateDealId } from '../domain/dealMachine'
import { useDemoActions } from '../store/DemoProvider'
import type { DealSpecInput } from '../domain/types'

export function FurnitureMakerNewDeal() {
  const { createDeal } = useDemoActions()
  const navigate = useNavigate()

  function handleSubmit(input: DealSpecInput) {
    const id = generateDealId()
    createDeal({ id, furnitureMakerId: 'demo-furniture-maker', ...input })
    navigate(`/furniture-maker/deal/${id}`)
  }

  return (
    <div className="grid gap-6 pb-10">
      <BackLink to="/furniture-maker" label="Мои сделки" />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Новая сделка</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Заполните что известно на первом разговоре с клиентом — остальное можно оставить пустым и
          уточнить позже.
        </p>
      </div>

      <DealSpecForm submitLabel="Создать сделку" onSubmit={handleSubmit} />
    </div>
  )
}
