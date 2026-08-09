import {
  CATEGORY_LABELS,
  HARDWARE_LABELS,
  MATERIAL_LABELS,
  QUALITY_LABELS,
  formatDimensions,
} from '../domain/orderSpecLabels'
import type { Deal } from '../domain/types'

export function OrderSpecSummary({ deal, hideContact }: { deal: Deal; hideContact?: boolean }) {
  const dimensions = formatDimensions(deal.widthCm, deal.heightCm, deal.depthCm)

  const rows: { label: string; value: string }[] = [
    deal.category ? { label: 'Тип мебели', value: CATEGORY_LABELS[deal.category] } : null,
    deal.hasUpholstery ? { label: 'Мягкие элементы', value: 'Есть' } : null,
    deal.lengthCm != null ? { label: 'Длина', value: `${deal.lengthCm} см` } : null,
    dimensions ? { label: 'Размеры (Ш×В×Г)', value: dimensions } : null,
    deal.estimatedProductionDays != null
      ? { label: 'Срок изготовления', value: `${deal.estimatedProductionDays} дн.` }
      : null,
    deal.material ? { label: 'Материал', value: MATERIAL_LABELS[deal.material] } : null,
    deal.finish ? { label: 'Отделка', value: deal.finish } : null,
    deal.qualityTier ? { label: 'Качество', value: QUALITY_LABELS[deal.qualityTier] } : null,
    deal.hardwareTier ? { label: 'Фурнитура', value: HARDWARE_LABELS[deal.hardwareTier] } : null,
    !hideContact && (deal.contactName || deal.contactPhone)
      ? { label: 'Контакт', value: [deal.contactName, deal.contactPhone].filter(Boolean).join(' · ') }
      : null,
  ].filter((r): r is { label: string; value: string } => r !== null)

  if (rows.length === 0) return null

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold">Характеристики заказа</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-2 sm:justify-start">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="font-medium sm:ml-auto">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
