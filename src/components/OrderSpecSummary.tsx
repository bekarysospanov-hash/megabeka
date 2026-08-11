import { FileText } from 'lucide-react'
import {
  APPLIANCE_ITEM_LABELS,
  APPLIANCE_MOUNT_LABELS,
  APPLIANCE_RELEVANT_CATEGORIES,
  CATEGORY_LABELS,
  CONFIGURATION_LABELS,
  COUNTERTOP_LABELS,
  COUNTERTOP_RELEVANT_CATEGORIES,
  FACADE_MATERIAL_LABELS,
  FACADE_TYPE_LABELS,
  HARDWARE_LABELS,
  MATERIAL_LABELS,
  OPENING_SYSTEM_LABELS,
  QUALITY_LABELS,
  SPECIAL_MECHANISM_LABELS,
} from '../domain/orderSpecLabels'
import { formatMoney } from '../domain/statusLabels'
import type { Deal } from '../domain/types'

export function OrderSpecSummary({ deal, hideContact }: { deal: Deal; hideContact?: boolean }) {
  // Столешница/техника могли остаться в данных после того, как категорию сменили правкой
  // (например, кухня → шкаф) — показываем их только пока категория всё ещё релевантна,
  // иначе сводка обещает клиенту то, что уже не относится к заказу.
  const showCountertop = deal.category != null && COUNTERTOP_RELEVANT_CATEGORIES.includes(deal.category)
  const showAppliances = deal.category != null && APPLIANCE_RELEVANT_CATEGORIES.includes(deal.category)

  const rows: { label: string; value: string }[] = [
    deal.category ? { label: 'Тип мебели', value: CATEGORY_LABELS[deal.category] } : null,
    deal.configuration ? { label: 'Конфигурация', value: CONFIGURATION_LABELS[deal.configuration] } : null,
    deal.hasUpholstery ? { label: 'Мягкие элементы', value: 'Есть' } : null,
    deal.lengthCm != null ? { label: 'Длина (по стенам)', value: `${deal.lengthCm} см` } : null,
    deal.heightCm != null ? { label: 'Высота', value: `${deal.heightCm} см` } : null,
    deal.depthCm != null ? { label: 'Глубина', value: `${deal.depthCm} см` } : null,
    deal.estimatedProductionDays != null
      ? { label: 'Срок изготовления', value: `${deal.estimatedProductionDays} дн.` }
      : null,
    deal.qualityTier ? { label: 'Ценовой сегмент', value: QUALITY_LABELS[deal.qualityTier] } : null,
    deal.material ? { label: 'Материал корпуса', value: MATERIAL_LABELS[deal.material] } : null,
    deal.facadeMaterial
      ? { label: 'Материал фасадов', value: FACADE_MATERIAL_LABELS[deal.facadeMaterial] }
      : null,
    deal.facadeType ? { label: 'Тип фасадов', value: FACADE_TYPE_LABELS[deal.facadeType] } : null,
    showCountertop && deal.countertopType
      ? { label: 'Столешница', value: COUNTERTOP_LABELS[deal.countertopType] }
      : null,
    deal.finish ? { label: 'Цвет / отделка', value: deal.finish } : null,
    deal.hardwareTier ? { label: 'Класс фурнитуры', value: HARDWARE_LABELS[deal.hardwareTier] } : null,
    deal.openingSystem ? { label: 'Система открывания', value: OPENING_SYSTEM_LABELS[deal.openingSystem] } : null,
    deal.drawerCount != null ? { label: 'Выдвижных ящиков', value: `${deal.drawerCount} шт.` } : null,
    deal.specialMechanisms.length > 0
      ? {
          label: 'Спецмеханизмы',
          value: deal.specialMechanisms.map((m) => SPECIAL_MECHANISM_LABELS[m]).join(', '),
        }
      : null,
    showAppliances && deal.applianceMount
      ? { label: 'Техника', value: APPLIANCE_MOUNT_LABELS[deal.applianceMount] }
      : null,
    showAppliances && deal.appliances.length > 0
      ? { label: 'Встраиваемая техника', value: deal.appliances.map((a) => APPLIANCE_ITEM_LABELS[a]).join(', ') }
      : null,
    showAppliances && deal.lightingNeeded ? { label: 'Подсветка', value: 'Нужна' } : null,
    deal.clientBudget != null ? { label: 'Ожидаемый бюджет клиента', value: formatMoney(deal.clientBudget) } : null,
    deal.desiredTimeline ? { label: 'Желаемые сроки', value: deal.desiredTimeline } : null,
    deal.referenceLink ? { label: 'Референс', value: deal.referenceLink } : null,
    !hideContact && (deal.contactName || deal.contactPhone)
      ? { label: 'Контакт', value: [deal.contactName, deal.contactPhone].filter(Boolean).join(' · ') }
      : null,
  ].filter((r): r is { label: string; value: string } => r !== null)

  if (rows.length === 0) {
    return (
      <section className="grid gap-2 rounded-lg border border-dashed p-6 text-center">
        <FileText className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold">Характеристики заказа ещё не заполнены</h2>
        <p className="mx-auto max-w-sm text-xs text-muted-foreground">
          Это спецификация — она войдёт в текст договора. Заполните форму заказа, чтобы клиент видел
          понятные условия.
        </p>
      </section>
    )
  }

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
