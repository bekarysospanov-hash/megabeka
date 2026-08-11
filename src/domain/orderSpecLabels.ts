import { Armchair, Baby, BedDouble, Briefcase, ChefHat, DoorOpen, Package, Sofa } from 'lucide-react'
import type {
  ApplianceItem,
  ApplianceMount,
  CountertopType,
  DealConfiguration,
  FacadeMaterial,
  FacadeType,
  FurnitureCategory,
  HardwareTier,
  MaterialType,
  OpeningSystem,
  QualityTier,
  SpecialMechanism,
} from './types'

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

// Единый источник правды для того, каким категориям релевантны кухонные/техника-поля —
// используется и формой заказа (что показывать), и сводкой характеристик (что не показывать
// после того, как категорию сменили правкой и старые кухонные поля остались в данных).
export const COUNTERTOP_RELEVANT_CATEGORIES: FurnitureCategory[] = ['kitchen']
export const APPLIANCE_RELEVANT_CATEGORIES: FurnitureCategory[] = ['kitchen', 'living_room']

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  chipboard_standard: 'ЛДСП Стандарт',
  chipboard_premium: 'ЛДСП Премиум',
  mdf: 'МДФ',
}

export const QUALITY_LABELS: Record<QualityTier, string> = {
  economy: 'Бюджет',
  standard: 'Комфорт',
  premium: 'Премиум',
}

export const HARDWARE_LABELS: Record<HardwareTier, string> = {
  budget: 'Бюджет (Китай)',
  mid: 'Средний (Boyard/GTV)',
  premium: 'Премиум (Blum/Hettich)',
}

export const CONFIGURATION_LABELS: Record<DealConfiguration, string> = {
  straight: 'Прямая',
  l_shaped: 'Г-образная',
  u_shaped: 'П-образная',
  built_in: 'Встроенная',
  freestanding: 'Корпусная (отдельно стоящая)',
}

export const FACADE_MATERIAL_LABELS: Record<FacadeMaterial, string> = {
  chipboard: 'ЛДСП',
  pvc_film: 'Плёнка ПВХ',
  plastic_hpl: 'Пластик (HPL/Fenix)',
  enamel_mdf: 'Эмаль (крашеный МДФ)',
  veneer_solid: 'Шпон / Массив',
}

export const FACADE_TYPE_LABELS: Record<FacadeType, string> = {
  smooth: 'Гладкие',
  milled: 'Фрезерованные (классика/интегрированная ручка)',
  glass_showcase: 'Витрины (стекло в профиле)',
}

export const COUNTERTOP_LABELS: Record<CountertopType, string> = {
  chipboard_plastic: 'ЛДСП пластик',
  compact_plate: 'Компакт-плита',
  acrylic_stone: 'Искусственный камень (акрил)',
  quartz_agglomerate: 'Кварцевый агломерат',
}

export const OPENING_SYSTEM_LABELS: Record<OpeningSystem, string> = {
  handles: 'Накладные ручки',
  gola_profile: 'Профиль Gola (без ручек)',
  push_to_open: 'Нажатие (Tip-on / Push-to-open)',
}

export const SPECIAL_MECHANISM_LABELS: Record<SpecialMechanism, string> = {
  lifters: 'Подъёмники для верхних шкафов',
  bottle_racks: 'Бутылочницы',
  pull_out_baskets: 'Выдвижные корзины',
  pantographs: 'Пантографы',
}

export const APPLIANCE_MOUNT_LABELS: Record<ApplianceMount, string> = {
  built_in: 'Встроенная',
  freestanding: 'Отдельно стоящая',
}

export const APPLIANCE_ITEM_LABELS: Record<ApplianceItem, string> = {
  fridge: 'Холодильник',
  cooktop: 'Варочная панель',
  oven: 'Духовой шкаф',
  microwave: 'СВЧ',
  dishwasher: 'ПММ',
  washing_machine: 'Стиральная машина',
  hood: 'Вытяжка',
}

export const REVISION_FIELD_LABELS: Record<string, string> = {
  amount: 'Сумма',
  deadline: 'Срок изготовления',
  title: 'Товар',
  category: 'Тип мебели',
  configuration: 'Конфигурация',
  material: 'Материал корпуса',
  facadeMaterial: 'Материал фасадов',
  facadeType: 'Тип фасадов',
  countertopType: 'Столешница',
  finish: 'Цвет / отделка',
  qualityTier: 'Ценовой сегмент',
  hardwareTier: 'Класс фурнитуры',
  openingSystem: 'Система открывания',
  drawerCount: 'Кол-во ящиков',
  heightCm: 'Высота',
  depthCm: 'Глубина',
  lengthCm: 'Длина',
}
