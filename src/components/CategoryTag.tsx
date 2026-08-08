import { CATEGORY_OPTIONS } from '../domain/orderSpecLabels'
import type { FurnitureCategory } from '../domain/types'

export function CategoryTag({ category }: { category: FurnitureCategory | null }) {
  if (!category) return null
  const opt = CATEGORY_OPTIONS.find((o) => o.value === category)
  if (!opt) return null
  const Icon = opt.icon
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      <Icon className="h-3 w-3" aria-hidden />
      {opt.label}
    </span>
  )
}
