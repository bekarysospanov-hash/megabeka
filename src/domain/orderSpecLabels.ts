import { Armchair, Baby, BedDouble, Briefcase, ChefHat, DoorOpen, Package, Sofa } from 'lucide-react'
import type { FurnitureCategory, HardwareTier, MaterialType, QualityTier } from './types'

export const CATEGORY_OPTIONS: { value: FurnitureCategory; label: string; icon: typeof ChefHat }[] = [
  { value: 'kitchen', label: 'Кухня', icon: ChefHat },
  { value: 'bedroom', label: 'Спальня', icon: BedDouble },
  { value: 'nursery', label: 'Детская', icon: Baby },
  { value: 'living_room', label: 'Гостиная', icon: Armchair },
  { value: 'hallway', label: 'Прихожая', icon: DoorOpen },
  { value: 'upholstered', label: 'Мягкая мебель', icon: Sofa },
  { value: 'office', label: 'Офисная', icon: Briefcase },
  { value: 'other', label: 'Другое', icon: Package },
]

export const CATEGORY_LABELS: Record<FurnitureCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<FurnitureCategory, string>

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  chipboard: 'ЛДСП',
  mdf: 'МДФ',
  solid_wood: 'Массив дерева',
  other: 'Другое',
}

export const QUALITY_LABELS: Record<QualityTier, string> = {
  economy: 'Эконом',
  standard: 'Стандарт',
  premium: 'Премиум',
}

export const HARDWARE_LABELS: Record<HardwareTier, string> = {
  standard: 'Стандарт',
  premium: 'Премиум (Blum/Hettich)',
  unspecified: 'Не определено',
}

export function formatDimensions(widthCm: number | null, heightCm: number | null, depthCm: number | null): string | null {
  const parts = [widthCm, heightCm, depthCm]
  if (parts.every((p) => p === null)) return null
  return parts.map((p) => (p === null ? '—' : p)).join(' × ') + ' см'
}
