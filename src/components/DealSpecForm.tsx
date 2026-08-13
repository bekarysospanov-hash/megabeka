import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SelectWithCustom } from './SelectWithCustom'
import { ToggleChips } from './ToggleChips'
import {
  APPLIANCE_ITEM_LABELS,
  APPLIANCE_MOUNT_LABELS,
  APPLIANCE_RELEVANT_CATEGORIES,
  CATEGORY_OPTIONS,
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
import type {
  ApplianceItem,
  ApplianceMount,
  DealSpecInput,
  FurnitureCategory,
  QualityTier,
  SpecialMechanism,
} from '../domain/types'
import { cn } from '@/lib/utils'

const DEFAULT_COMMISSION_PERCENT = 10

type SplitScheme = 'even' | 'three_way'

// Ровно два варианта сплита, которые попросил бизнес — не проектирую произвольный конструктор
// процентов, только эти два пресета. Кнопки — это ярлыки, которые ЯВНО перезаписывают все три
// процента разом; сами проценты хранятся как обычное состояние формы (инициализированное из
// initial), а не выводятся из выбранной схемы — иначе сохранение любого другого поля в форме
// правок тихо перетирало бы реальный сплит сделки на ближайший пресет (было найдено ревью).
const SPLIT_PRESETS: Record<
  SplitScheme,
  { label: string; prepaymentPercent: number; interimPercent: number; finalPercent: number }
> = {
  even: { label: '50 / 50', prepaymentPercent: 50, interimPercent: 0, finalPercent: 50 },
  three_way: { label: '30 / 30 / 40', prepaymentPercent: 30, interimPercent: 30, finalPercent: 40 },
}

function FormSection({
  step,
  title,
  hint,
  children,
}: {
  step: number
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-3 rounded-lg border p-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
            {step}
          </span>
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function DealSpecForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: DealSpecInput
  submitLabel: string
  onSubmit: (input: DealSpecInput) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [contactName, setContactName] = useState(initial?.contactName ?? '')
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? '')
  const [category, setCategory] = useState<FurnitureCategory | null>(initial?.category ?? null)
  const [categoryCustom, setCategoryCustom] = useState(initial?.categoryCustom ?? '')
  const [hasUpholstery, setHasUpholstery] = useState(initial?.hasUpholstery ?? false)
  const [configuration, setConfiguration] = useState(initial?.configuration ?? '')
  const [lengthMm, setLengthMm] = useState(initial?.lengthMm != null ? String(initial.lengthMm) : '')
  const [heightMm, setHeightMm] = useState(initial?.heightMm != null ? String(initial.heightMm) : '')
  const [depthMm, setDepthMm] = useState(initial?.depthMm != null ? String(initial.depthMm) : '')
  const [material, setMaterial] = useState(initial?.material ?? '')
  const [facadeColor, setFacadeColor] = useState(initial?.facadeColor ?? '')
  const [countertopColor, setCountertopColor] = useState(initial?.countertopColor ?? '')
  const [qualityTier, setQualityTier] = useState<QualityTier | ''>(initial?.qualityTier ?? '')
  const [facadeMaterial, setFacadeMaterial] = useState(initial?.facadeMaterial ?? '')
  const [facadeType, setFacadeType] = useState(initial?.facadeType ?? '')
  const [countertopType, setCountertopType] = useState(initial?.countertopType ?? '')
  const [hardwareTier, setHardwareTier] = useState(initial?.hardwareTier ?? '')
  const [openingSystem, setOpeningSystem] = useState(initial?.openingSystem ?? '')
  const [drawerCount, setDrawerCount] = useState(
    initial?.drawerCount != null ? String(initial.drawerCount) : '',
  )
  const [specialMechanisms, setSpecialMechanisms] = useState<SpecialMechanism[]>(
    initial?.specialMechanisms ?? [],
  )
  const [applianceMount, setApplianceMount] = useState<ApplianceMount | ''>(initial?.applianceMount ?? '')
  const [appliances, setAppliances] = useState<ApplianceItem[]>(initial?.appliances ?? [])
  const [lightingNeeded, setLightingNeeded] = useState(initial?.lightingNeeded ?? false)
  const [estimatedProductionDays, setEstimatedProductionDays] = useState(
    initial?.estimatedProductionDays != null ? String(initial.estimatedProductionDays) : '',
  )

  const [prepaymentPercent, setPrepaymentPercent] = useState(
    initial?.prepaymentPercent ?? SPLIT_PRESETS.even.prepaymentPercent,
  )
  const [interimPercent, setInterimPercent] = useState(
    initial?.interimPercent ?? SPLIT_PRESETS.even.interimPercent,
  )
  const [finalPercent, setFinalPercent] = useState(initial?.finalPercent ?? SPLIT_PRESETS.even.finalPercent)
  const commissionPercent = initial?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT

  function applySplitPreset(preset: (typeof SPLIT_PRESETS)[SplitScheme]) {
    setPrepaymentPercent(preset.prepaymentPercent)
    setInterimPercent(preset.interimPercent)
    setFinalPercent(preset.finalPercent)
  }

  const activeSplitScheme = (Object.entries(SPLIT_PRESETS) as [SplitScheme, (typeof SPLIT_PRESETS)[SplitScheme]][]).find(
    ([, preset]) =>
      preset.prepaymentPercent === prepaymentPercent &&
      preset.interimPercent === interimPercent &&
      preset.finalPercent === finalPercent,
  )?.[0]

  const canSubmit = title.trim().length > 0 && Number(amount) > 0 && contactPhone.trim().length > 0
  const showApplianceSection = category != null && APPLIANCE_RELEVANT_CATEGORIES.includes(category)
  const showCountertop = category != null && COUNTERTOP_RELEVANT_CATEGORIES.includes(category)

  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      title: title.trim(),
      amount: Number(amount),
      prepaymentPercent,
      interimPercent,
      finalPercent,
      commissionPercent,
      contactName: contactName.trim() || null,
      contactPhone: contactPhone.trim() || null,
      category,
      categoryCustom: category === 'other' ? categoryCustom.trim() || null : null,
      hasUpholstery,
      configuration: configuration || null,
      lengthMm: lengthMm ? Number(lengthMm) : null,
      heightMm: heightMm ? Number(heightMm) : null,
      depthMm: depthMm ? Number(depthMm) : null,
      material: material || null,
      facadeColor: facadeColor || null,
      countertopColor: showCountertop ? countertopColor || null : null,
      qualityTier: qualityTier || null,
      hardwareTier: hardwareTier || null,
      facadeMaterial: facadeMaterial || null,
      facadeType: facadeType || null,
      countertopType: showCountertop ? countertopType || null : null,
      openingSystem: openingSystem || null,
      drawerCount: drawerCount ? Number(drawerCount) : null,
      specialMechanisms,
      applianceMount: showApplianceSection ? applianceMount || null : null,
      appliances: showApplianceSection ? appliances : [],
      lightingNeeded: showApplianceSection ? lightingNeeded : false,
      estimatedProductionDays: estimatedProductionDays ? Number(estimatedProductionDays) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="deal-title">Название заказа</Label>
        <Input
          id="deal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например, кухонный гарнитур на заказ"
        />
      </div>

      <FormSection step={1} title="Клиент" hint="Телефон нужен, чтобы отправить клиенту ссылку на сделку">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-name">Имя</Label>
            <Input id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Необязательно" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-phone">Телефон</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+7 700 000 00 00"
            />
          </div>
        </div>
      </FormSection>

      <FormSection step={2} title="Тип мебели">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CATEGORY_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = category === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(active ? null : opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:border-primary/40 hover:bg-accent/40',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {opt.label}
              </button>
            )
          })}
        </div>
        {category === 'other' && (
          <div className="grid gap-1.5 pt-1">
            <Label htmlFor="category-custom">Уточните тип мебели</Label>
            <Input
              id="category-custom"
              value={categoryCustom}
              onChange={(e) => setCategoryCustom(e.target.value)}
              placeholder="Например, стеллаж для книг"
            />
          </div>
        )}
        <label className="flex items-center gap-2.5 pt-1 text-sm">
          <Switch checked={hasUpholstery} onCheckedChange={setHasUpholstery} />
          Есть мягкие элементы (обивка)
        </label>
      </FormSection>

      <FormSection step={3} title="Конфигурация" hint="Необязательно">
        <SelectWithCustom
          value={configuration}
          onChange={setConfiguration}
          options={CONFIGURATION_LABELS}
          className="w-fit min-w-56"
        />
      </FormSection>

      <FormSection step={4} title="Размеры" hint="Примерно, если известно">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="dim-length">Длина (по стенам), мм</Label>
            <Input id="dim-length" type="number" min={0} value={lengthMm} onChange={(e) => setLengthMm(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dim-height">Высота, мм</Label>
            <Input id="dim-height" type="number" min={0} value={heightMm} onChange={(e) => setHeightMm(e.target.value)} />
            <p className="text-xs text-muted-foreground">От пола до потолка в помещении</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dim-depth">Глубина, мм</Label>
            <Input id="dim-depth" type="number" min={0} value={depthMm} onChange={(e) => setDepthMm(e.target.value)} />
          </div>
        </div>
      </FormSection>

      <FormSection step={5} title="Материалы и дизайн">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Ценовой сегмент</Label>
            <Select value={qualityTier} onValueChange={(v) => setQualityTier(v as QualityTier)}>
              <SelectTrigger>
                <SelectValue placeholder="Не выбрано" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QUALITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Материал корпуса (каркас)</Label>
            <SelectWithCustom value={material} onChange={setMaterial} options={MATERIAL_LABELS} />
          </div>
          <div className="grid gap-1.5">
            <Label>Материал фасадов</Label>
            <SelectWithCustom
              value={facadeMaterial}
              onChange={setFacadeMaterial}
              options={FACADE_MATERIAL_LABELS}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Тип фасадов</Label>
            <SelectWithCustom value={facadeType} onChange={setFacadeType} options={FACADE_TYPE_LABELS} />
          </div>
          <div className="grid gap-1.5">
            <Label>Цвет фасада</Label>
            <SelectWithCustom value={facadeColor} onChange={setFacadeColor} options={FACADE_COLOR_LABELS} />
          </div>
          {showCountertop && (
            <>
              <div className="grid gap-1.5">
                <Label>Столешница</Label>
                <SelectWithCustom
                  value={countertopType}
                  onChange={setCountertopType}
                  options={COUNTERTOP_LABELS}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Цвет столешницы</Label>
                <SelectWithCustom
                  value={countertopColor}
                  onChange={setCountertopColor}
                  options={COUNTERTOP_COLOR_LABELS}
                />
              </div>
            </>
          )}
        </div>
      </FormSection>

      <FormSection step={6} title="Фурнитура и функционал">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Класс фурнитуры</Label>
            <SelectWithCustom value={hardwareTier} onChange={setHardwareTier} options={HARDWARE_LABELS} />
          </div>
          <div className="grid gap-1.5">
            <Label>Система открывания</Label>
            <SelectWithCustom
              value={openingSystem}
              onChange={setOpeningSystem}
              options={OPENING_SYSTEM_LABELS}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="drawer-count">Количество выдвижных ящиков (ориентировочно)</Label>
            <Input
              id="drawer-count"
              type="number"
              min={0}
              value={drawerCount}
              onChange={(e) => setDrawerCount(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
        </div>
        <div className="grid gap-1.5 pt-1">
          <Label>Специальные механизмы</Label>
          <ToggleChips
            options={Object.keys(SPECIAL_MECHANISM_LABELS) as SpecialMechanism[]}
            labels={SPECIAL_MECHANISM_LABELS}
            selected={specialMechanisms}
            onToggle={(v) => setSpecialMechanisms((prev) => toggle(prev, v))}
          />
        </div>
      </FormSection>

      {showApplianceSection && (
        <FormSection step={7} title="Техника и доп. элементы" hint="Актуально для кухонь и мебели под ТВ">
          <div className="grid gap-1.5">
            <Label>Техника</Label>
            <Select value={applianceMount} onValueChange={(v) => setApplianceMount(v as ApplianceMount)}>
              <SelectTrigger className="w-fit min-w-48">
                <SelectValue placeholder="Не выбрано" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(APPLIANCE_MOUNT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 pt-1">
            <Label>Что нужно встроить</Label>
            <ToggleChips
              options={Object.keys(APPLIANCE_ITEM_LABELS) as ApplianceItem[]}
              labels={APPLIANCE_ITEM_LABELS}
              selected={appliances}
              onToggle={(v) => setAppliances((prev) => toggle(prev, v))}
            />
          </div>
          <label className="flex items-center gap-2.5 pt-1 text-sm">
            <Switch checked={lightingNeeded} onCheckedChange={setLightingNeeded} />
            Нужна подсветка (врезная светодиодная лента)
          </label>
        </FormSection>
      )}

      <FormSection step={showApplianceSection ? 8 : 7} title="Финансовые и временные рамки">
        <div className="grid gap-1.5">
          <Label>Разбивка оплаты</Label>
          <div className="flex gap-2">
            {(Object.entries(SPLIT_PRESETS) as [SplitScheme, (typeof SPLIT_PRESETS)[SplitScheme]][]).map(
              ([scheme, preset]) => (
                <button
                  key={scheme}
                  type="button"
                  onClick={() => applySplitPreset(preset)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                    activeSplitScheme === scheme
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:border-primary/40 hover:bg-accent/40',
                  )}
                >
                  {preset.label}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="deal-amount">Сумма, ₸</Label>
            <Input
              id="deal-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {interimPercent > 0
                ? `Аванс ${prepaymentPercent}% / промежуточный ${interimPercent}% / финальный ${finalPercent}%`
                : `Предоплата ${prepaymentPercent}% / финальный платёж ${finalPercent}%`}{' '}
              · комиссия платформы {commissionPercent}%
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="deal-production-days">Срок изготовления, дней</Label>
            <Input
              id="deal-production-days"
              type="number"
              min={0}
              value={estimatedProductionDays}
              onChange={(e) => setEstimatedProductionDays(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
        </div>
      </FormSection>

      <Button type="submit" disabled={!canSubmit} className="w-fit">
        {submitLabel}
      </Button>
    </form>
  )
}
