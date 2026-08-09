import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BackLink } from '../components/BackLink'
import { generateDealId } from '../domain/dealMachine'
import { CATEGORY_OPTIONS, HARDWARE_LABELS, MATERIAL_LABELS, QUALITY_LABELS } from '../domain/orderSpecLabels'
import { useDemoActions } from '../store/DemoProvider'
import type { FurnitureCategory, HardwareTier, MaterialType, QualityTier } from '../domain/types'
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
  children: React.ReactNode
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

export function FurnitureMakerNewDeal() {
  const { createDeal } = useDemoActions()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [category, setCategory] = useState<FurnitureCategory | null>(null)
  const [hasUpholstery, setHasUpholstery] = useState(false)
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [depthCm, setDepthCm] = useState('')
  const [material, setMaterial] = useState<MaterialType | ''>('')
  const [finish, setFinish] = useState('')
  const [qualityTier, setQualityTier] = useState<QualityTier | ''>('')
  const [hardwareTier, setHardwareTier] = useState<HardwareTier | ''>('')
  const [estimatedProductionDays, setEstimatedProductionDays] = useState('')

  const canSubmit = title.trim().length > 0 && Number(amount) > 0 && contactPhone.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const id = generateDealId()
    createDeal({
      id,
      furnitureMakerId: 'demo-furniture-maker',
      title: title.trim(),
      amount: Number(amount),
      prepaymentPercent: DEFAULT_PREPAYMENT_PERCENT,
      finalPercent: DEFAULT_FINAL_PERCENT,
      commissionPercent: DEFAULT_COMMISSION_PERCENT,
      contactName: contactName.trim() || null,
      contactPhone: contactPhone.trim() || null,
      category,
      hasUpholstery,
      lengthCm: lengthCm ? Number(lengthCm) : null,
      widthCm: widthCm ? Number(widthCm) : null,
      heightCm: heightCm ? Number(heightCm) : null,
      depthCm: depthCm ? Number(depthCm) : null,
      material: material || null,
      finish: finish.trim() || null,
      qualityTier: qualityTier || null,
      hardwareTier: hardwareTier || null,
      estimatedProductionDays: estimatedProductionDays ? Number(estimatedProductionDays) : null,
    })
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

        <FormSection step={3} title="Размеры" hint="Примерно, если известно">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="dim-length">Длина, см</Label>
              <Input id="dim-length" type="number" min={0} value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dim-width">Ширина, см</Label>
              <Input id="dim-width" type="number" min={0} value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dim-height">Высота, см</Label>
              <Input id="dim-height" type="number" min={0} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dim-depth">Глубина, см</Label>
              <Input id="dim-depth" type="number" min={0} value={depthCm} onChange={(e) => setDepthCm(e.target.value)} />
            </div>
          </div>
        </FormSection>

        <FormSection step={4} title="Материал">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Корпус</Label>
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
              <Label htmlFor="finish">Цвет / отделка</Label>
              <Input id="finish" value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Например, дуб сонома" />
            </div>
          </div>
        </FormSection>

        <FormSection step={5} title="Качество" hint="Ценовой уровень — ориентир для расчёта">
          <Select value={qualityTier} onValueChange={(v) => setQualityTier(v as QualityTier)}>
            <SelectTrigger className="w-fit min-w-48">
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
        </FormSection>

        <FormSection step={6} title="Фурнитура">
          <Select value={hardwareTier} onValueChange={(v) => setHardwareTier(v as HardwareTier)}>
            <SelectTrigger className="w-fit min-w-48">
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
        </FormSection>

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
              Предоплата {DEFAULT_PREPAYMENT_PERCENT}% / финальный платёж {DEFAULT_FINAL_PERCENT}% ·
              комиссия платформы {DEFAULT_COMMISSION_PERCENT}%
            </p>
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
        </div>

        <Button type="submit" disabled={!canSubmit} className="w-fit">
          Создать сделку
        </Button>
      </form>
    </div>
  )
}
