import { FileText } from 'lucide-react'
import {
  APPLIANCE_ITEM_LABELS,
  APPLIANCE_MOUNT_LABELS,
  APPLIANCE_RELEVANT_CATEGORIES,
  CATEGORY_LABELS,
  CONFIGURATION_LABELS,
  COUNTERTOP_COLOR_LABELS,
  COUNTERTOP_LABELS,
  COUNTERTOP_RELEVANT_CATEGORIES,
  FACADE_COLOR_LABELS,
  FACADE_MATERIAL_LABELS,
  FACADE_TYPE_LABELS,
  HARDWARE_LABELS,
  MATERIAL_LABELS,
  OPENING_SYSTEM_LABELS,
  QUALITY_LABELS,
  SPECIAL_MECHANISM_LABELS,
} from '../domain/orderSpecLabels'
import type { Deal } from '../domain/types'

export function OrderSpecSummary({ deal, hideContact }: { deal: Deal; hideContact?: boolean }) {
  // Столешница/техника могли остаться в данных после того, как категорию сменили правкой
  // (например, кухня → шкаф) — показываем их только пока категория всё ещё релевантна,
  // иначе сводка обещает клиенту то, что уже не относится к заказу.
  const showCountertop = deal.category != null && COUNTERTOP_RELEVANT_CATEGORIES.includes(deal.category)
  const showAppliances = deal.category != null && APPLIANCE_RELEVANT_CATEGORIES.includes(deal.category)
  // Поля выбора допускают «своё значение», не только пресет из справочника — если значения
  // нет в LABELS, значит это вписанный клиентом/мебельщиком текст, показываем его как есть.
  const categoryLabel =
    deal.category === 'other' && deal.categoryCustom ? deal.categoryCustom : deal.category ? CATEGORY_LABELS[deal.category] : null

  const rows: { label: string; value: string }[] = [
    categoryLabel ? { label: 'Тип мебели', value: categoryLabel } : null,
    deal.configuration
      ? { label: 'Конфигурация', value: CONFIGURATION_LABELS[deal.configuration] ?? deal.configuration }
      : null,
    deal.hasUpholstery ? { label: 'Мягкие элементы', value: 'Есть' } : null,
    deal.lengthMm != null ? { label: 'Длина (по стенам)', value: `${deal.lengthMm} мм` } : null,
    deal.heightMm != null ? { label: 'Высота', value: `${deal.heightMm} мм` } : null,
    deal.depthMm != null ? { label: 'Глубина', value: `${deal.depthMm} мм` } : null,
    deal.estimatedProductionDays != null
      ? { label: 'Срок изготовления', value: `${deal.estimatedProductionDays} дн.` }
      : null,
    deal.qualityTier ? { label: 'Ценовой сегмент', value: QUALITY_LABELS[deal.qualityTier] } : null,
    deal.material ? { label: 'Материал корпуса', value: MATERIAL_LABELS[deal.material] ?? deal.material } : null,
    deal.facadeMaterial
      ? { label: 'Материал фасадов', value: FACADE_MATERIAL_LABELS[deal.facadeMaterial] ?? deal.facadeMaterial }
      : null,
    deal.facadeType
      ? { label: 'Тип фасадов', value: FACADE_TYPE_LABELS[deal.facadeType] ?? deal.facadeType }
      : null,
    deal.facadeColor
      ? { label: 'Цвет фасада', value: FACADE_COLOR_LABELS[deal.facadeColor] ?? deal.facadeColor }
      : null,
    showCountertop && deal.countertopType
      ? { label: 'Столешница', value: COUNTERTOP_LABELS[deal.countertopType] ?? deal.countertopType }
      : null,
    showCountertop && deal.countertopColor
      ? { label: 'Цвет столешницы', value: COUNTERTOP_COLOR_LABELS[deal.countertopColor] ?? deal.countertopColor }
      : null,
    deal.hardwareTier
      ? { label: 'Класс фурнитуры', value: HARDWARE_LABELS[deal.hardwareTier] ?? deal.hardwareTier }
      : null,
    deal.openingSystem
      ? { label: 'Система открывания', value: OPENING_SYSTEM_LABELS[deal.openingSystem] ?? deal.openingSystem }
      : null,
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
