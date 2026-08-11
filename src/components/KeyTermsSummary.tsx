import {
  CATEGORY_LABELS,
  CONFIGURATION_LABELS,
  FACADE_MATERIAL_LABELS,
  HARDWARE_LABELS,
  MATERIAL_LABELS,
  QUALITY_LABELS,
} from '../domain/orderSpecLabels'
import { formatMoney } from '../domain/statusLabels'
import type { Deal } from '../domain/types'

export function KeyTermsSummary({ deal }: { deal: Deal }) {
  const materialQuality = [
    deal.material ? MATERIAL_LABELS[deal.material] : null,
    deal.qualityTier ? QUALITY_LABELS[deal.qualityTier] : null,
  ]
    .filter(Boolean)
    .join(', ')

  const dimensions = [
    deal.lengthCm != null ? `Д ${deal.lengthCm}` : null,
    deal.heightCm != null ? `В ${deal.heightCm}` : null,
    deal.depthCm != null ? `Г ${deal.depthCm}` : null,
  ]
    .filter(Boolean)
    .join(' × ')

  return (
    <section className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
      <h2 className="mb-3 text-sm font-semibold">Ключевые условия</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-2 sm:justify-start">
          <dt className="text-muted-foreground">Сумма</dt>
          <dd className="font-medium sm:ml-auto">{formatMoney(deal.amount)}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:justify-start">
          <dt className="text-muted-foreground">Оплата</dt>
          <dd className="font-medium sm:ml-auto">
            {deal.prepaymentPercent}% предоплата / {deal.finalPercent}% финал
          </dd>
        </div>
        {deal.category && (
          <div className="flex justify-between gap-2 sm:justify-start">
            <dt className="text-muted-foreground">Тип мебели</dt>
            <dd className="font-medium sm:ml-auto">
              {CATEGORY_LABELS[deal.category]}
              {deal.configuration && `, ${CONFIGURATION_LABELS[deal.configuration]}`}
            </dd>
          </div>
        )}
        {dimensions && (
          <div className="flex justify-between gap-2 sm:justify-start">
            <dt className="text-muted-foreground">Размеры, см</dt>
            <dd className="font-medium sm:ml-auto">{dimensions}</dd>
          </div>
        )}
        {deal.estimatedProductionDays != null && (
          <div className="flex justify-between gap-2 sm:justify-start">
            <dt className="text-muted-foreground">Срок изготовления</dt>
            <dd className="font-medium sm:ml-auto">{deal.estimatedProductionDays} дн.</dd>
          </div>
        )}
        {materialQuality && (
          <div className="flex justify-between gap-2 sm:justify-start">
            <dt className="text-muted-foreground">Материал</dt>
            <dd className="font-medium sm:ml-auto">{materialQuality}</dd>
          </div>
        )}
        {deal.facadeMaterial && (
          <div className="flex justify-between gap-2 sm:justify-start">
            <dt className="text-muted-foreground">Фасады</dt>
            <dd className="font-medium sm:ml-auto">{FACADE_MATERIAL_LABELS[deal.facadeMaterial]}</dd>
          </div>
        )}
        {deal.hardwareTier && (
          <div className="flex justify-between gap-2 sm:justify-start">
            <dt className="text-muted-foreground">Класс фурнитуры</dt>
            <dd className="font-medium sm:ml-auto">{HARDWARE_LABELS[deal.hardwareTier]}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
