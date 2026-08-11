import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleChips } from './ToggleChips'
import {
  APPLIANCE_ITEM_LABELS,
  APPLIANCE_MOUNT_LABELS,
  APPLIANCE_RELEVANT_CATEGORIES,
  CATEGORY_OPTIONS,
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
import type {
  ApplianceItem,
  ApplianceMount,
  CountertopType,
  DealConfiguration,
  DealSpecInput,
  FacadeMaterial,
  FacadeType,
  FurnitureCategory,
  HardwareTier,
  MaterialType,
  OpeningSystem,
  QualityTier,
  SpecialMechanism,
} from '../domain/types'
import { cn } from '@/lib/utils'

const DEFAULT_PREPAYMENT_PERCENT = 50
const DEFAULT_FINAL_PERCENT = 50
const DEFAULT_COMMISSION_PERCENT = 10

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
  const [hasUpholstery, setHasUpholstery] = useState(initial?.hasUpholstery ?? false)
  const [configuration, setConfiguration] = useState<DealConfiguration | ''>(initial?.configuration ?? '')
  const [lengthCm, setLengthCm] = useState(initial?.lengthCm != null ? String(initial.lengthCm) : '')
  const [heightCm, setHeightCm] = useState(initial?.heightCm != null ? String(initial.heightCm) : '')
  const [depthCm, setDepthCm] = useState(initial?.depthCm != null ? String(initial.depthCm) : '')
  const [material, setMaterial] = useState<MaterialType | ''>(initial?.material ?? '')
  const [finish, setFinish] = useState(initial?.finish ?? '')
  const [qualityTier, setQualityTier] = useState<QualityTier | ''>(initial?.qualityTier ?? '')
  const [facadeMaterial, setFacadeMaterial] = useState<FacadeMaterial | ''>(initial?.facadeMaterial ?? '')
  const [facadeType, setFacadeType] = useState<FacadeType | ''>(initial?.facadeType ?? '')
  const [countertopType, setCountertopType] = useState<CountertopType | ''>(initial?.countertopType ?? '')
  const [hardwareTier, setHardwareTier] = useState<HardwareTier | ''>(initial?.hardwareTier ?? '')
  const [openingSystem, setOpeningSystem] = useState<OpeningSystem | ''>(initial?.openingSystem ?? '')
  const [drawerCount, setDrawerCount] = useState(
    initial?.drawerCount != null ? String(initial.drawerCount) : '',
  )
  const [specialMechanisms, setSpecialMechanisms] = useState<SpecialMechanism[]>(
    initial?.specialMechanisms ?? [],
  )
  const [applianceMount, setApplianceMount] = useState<ApplianceMount | ''>(initial?.applianceMount ?? '')
  const [appliances, setAppliances] = useState<ApplianceItem[]>(initial?.appliances ?? [])
  const [lightingNeeded, setLightingNeeded] = useState(initial?.lightingNeeded ?? false)
  const [clientBudget, setClientBudget] = useState(
    initial?.clientBudget != null ? String(initial.clientBudget) : '',
  )
  const [desiredTimeline, setDesiredTimeline] = useState(initial?.desiredTimeline ?? '')
  const [referenceLink, setReferenceLink] = useState(initial?.referenceLink ?? '')
  const [estimatedProductionDays, setEstimatedProductionDays] = useState(
    initial?.estimatedProductionDays != null ? String(initial.estimatedProductionDays) : '',
  )

  const prepaymentPercent = initial?.prepaymentPercent ?? DEFAULT_PREPAYMENT_PERCENT
  const finalPercent = initial?.finalPercent ?? DEFAULT_FINAL_PERCENT
  const commissionPercent = initial?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT

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
      finalPercent,
      commissionPercent,
      contactName: contactName.trim() || null,
      contactPhone: contactPhone.trim() || null,
      category,
      hasUpholstery,
      configuration: configuration || null,
      lengthCm: lengthCm ? Number(lengthCm) : null,
      heightCm: heightCm ? Number(heightCm) : null,
      depthCm: depthCm ? Number(depthCm) : null,
      material: material || null,
      finish: finish.trim() || null,
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
      clientBudget: clientBudget ? Number(clientBudget) : null,
      desiredTimeline: desiredTimeline.trim() || null,
      referenceLink: referenceLink.trim() || null,
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
        <label className="flex items-center gap-2.5 pt-1 text-sm">
          <Switch checked={hasUpholstery} onCheckedChange={setHasUpholstery} />
          Есть мягкие элементы (обивка)
        </label>
      </FormSection>

      <FormSection step={3} title="Конфигурация" hint="Необязательно">
        <Select value={configuration} onValueChange={(v) => setConfiguration(v as DealConfiguration)}>
          <SelectTrigger className="w-fit min-w-56">
            <SelectValue placeholder="Не выбрано" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONFIGURATION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormSection>

      <FormSection step={4} title="Размеры" hint="Примерно, если известно">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="dim-length">Длина (по стенам), см</Label>
            <Input id="dim-length" type="number" min={0} value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dim-height">Высота, см</Label>
            <Input id="dim-height" type="number" min={0} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            <p className="text-xs text-muted-foreground">От пола до потолка в помещении</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dim-depth">Глубина, см</Label>
            <Input id="dim-depth" type="number" min={0} value={depthCm} onChange={(e) => setDepthCm(e.target.value)} />
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
            <Select value={material} onValueChange={(v) => setMaterial(v as MaterialType)}>
              <SelectTrigger>
                <SelectValue placeholder="Не выбрано" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MATERIAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Материал фасадов</Label>
            <Select value={facadeMaterial} onValueChange={(v) => setFacadeMaterial(v as FacadeMaterial)}>
              <SelectTrigger>
                <SelectValue placeholder="Не выбрано" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FACADE_MATERIAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Тип фасадов</Label>
            <Select value={facadeType} onValueChange={(v) => setFacadeType(v as FacadeType)}>
              <SelectTrigger>
                <SelectValue placeholder="Не выбрано" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FACADE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showCountertop && (
            <div className="grid gap-1.5">
              <Label>Столешница</Label>
              <Select value={countertopType} onValueChange={(v) => setCountertopType(v as CountertopType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Не выбрано" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNTERTOP_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="finish">Цвет / отделка</Label>
            <Input id="finish" value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Например, дуб сонома" />
          </div>
        </div>
      </FormSection>

      <FormSection step={6} title="Фурнитура и функционал">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Класс фурнитуры</Label>
            <Select value={hardwareTier} onValueChange={(v) => setHardwareTier(v as HardwareTier)}>
              <SelectTrigger>
                <SelectValue placeholder="Не выбрано" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(HARDWARE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Система открывания</Label>
            <Select value={openingSystem} onValueChange={(v) => setOpeningSystem(v as OpeningSystem)}>
              <SelectTrigger>
                <SelectValue placeholder="Не выбрано" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OPENING_SYSTEM_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="deal-amount">Примерная сумма, ₸</Label>
            <Input
              id="deal-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Предоплата {prepaymentPercent}% / финальный платёж {finalPercent}% · комиссия платформы{' '}
              {commissionPercent}%
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="client-budget">Ожидаемый бюджет клиента, ₸</Label>
            <Input
              id="client-budget"
              type="number"
              min={0}
              value={clientBudget}
              onChange={(e) => setClientBudget(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="deal-production-days">Ориентировочный срок изготовления, дней</Label>
            <Input
              id="deal-production-days"
              type="number"
              min={0}
              value={estimatedProductionDays}
              onChange={(e) => setEstimatedProductionDays(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desired-timeline">Желаемые сроки реализации</Label>
            <Input
              id="desired-timeline"
              value={desiredTimeline}
              onChange={(e) => setDesiredTimeline(e.target.value)}
              placeholder="Например, к Новому году"
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="reference-link">Ссылка на референс / дизайн-проект</Label>
            <Input
              id="reference-link"
              value={referenceLink}
              onChange={(e) => setReferenceLink(e.target.value)}
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
