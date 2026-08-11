import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleChips } from './ToggleChips'
import {
  CATEGORY_LABELS,
  CONFIGURATION_LABELS,
  COUNTERTOP_LABELS,
  FACADE_MATERIAL_LABELS,
  FACADE_TYPE_LABELS,
  HARDWARE_LABELS,
  MATERIAL_LABELS,
  OPENING_SYSTEM_LABELS,
  QUALITY_LABELS,
} from '../domain/orderSpecLabels'
import type { Deal } from '../domain/types'

export type RevisionFieldKey =
  | 'amount'
  | 'deadline'
  | 'category'
  | 'configuration'
  | 'material'
  | 'facadeMaterial'
  | 'facadeType'
  | 'countertopType'
  | 'finish'
  | 'qualityTier'
  | 'hardwareTier'
  | 'openingSystem'
  | 'drawerCount'
  | 'heightCm'
  | 'depthCm'
  | 'lengthCm'

export interface RevisionSubmission {
  field: RevisionFieldKey
  oldValue: string
  newValue: string
}

const NUMERIC_FIELDS = new Set<RevisionFieldKey>([
  'amount',
  'deadline',
  'drawerCount',
  'heightCm',
  'depthCm',
  'lengthCm',
])
const SELECT_OPTIONS: Partial<Record<RevisionFieldKey, Record<string, string>>> = {
  category: CATEGORY_LABELS,
  configuration: CONFIGURATION_LABELS,
  material: MATERIAL_LABELS,
  facadeMaterial: FACADE_MATERIAL_LABELS,
  facadeType: FACADE_TYPE_LABELS,
  countertopType: COUNTERTOP_LABELS,
  qualityTier: QUALITY_LABELS,
  hardwareTier: HARDWARE_LABELS,
  openingSystem: OPENING_SYSTEM_LABELS,
}

const FIELD_LABELS: Record<RevisionFieldKey, string> = {
  amount: 'Сумма',
  deadline: 'Срок изготовления',
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
  heightCm: 'Высота, см',
  depthCm: 'Глубина, см',
  lengthCm: 'Длина, см',
}

// Порядок полей для чипов и для итогового списка инпутов — сохраняем группировку по смыслу,
// но без пронумерованных секций-боксов (было 3 боксa × N boxed-тумблеров каждый).
// Мультиселекты формы заказа (спецмеханизмы/техника) и информационные поля (бюджет клиента,
// желаемые сроки, референс) сознательно вне скоупа запроса правок — это не то, что мебельщик
// обязуется исполнить как согласованную спецификацию.
const REVISION_FIELD_ORDER: RevisionFieldKey[] = [
  'amount',
  'deadline',
  'category',
  'configuration',
  'material',
  'facadeMaterial',
  'facadeType',
  'countertopType',
  'finish',
  'qualityTier',
  'hardwareTier',
  'openingSystem',
  'drawerCount',
  'heightCm',
  'depthCm',
  'lengthCm',
]

function currentValue(deal: Deal, field: RevisionFieldKey): string {
  switch (field) {
    case 'amount':
      return String(deal.amount)
    case 'deadline':
      return deal.estimatedProductionDays != null ? String(deal.estimatedProductionDays) : '—'
    case 'category':
      return deal.category ? CATEGORY_LABELS[deal.category] : '—'
    case 'configuration':
      return deal.configuration ? CONFIGURATION_LABELS[deal.configuration] : '—'
    case 'material':
      return deal.material ? MATERIAL_LABELS[deal.material] : '—'
    case 'facadeMaterial':
      return deal.facadeMaterial ? FACADE_MATERIAL_LABELS[deal.facadeMaterial] : '—'
    case 'facadeType':
      return deal.facadeType ? FACADE_TYPE_LABELS[deal.facadeType] : '—'
    case 'countertopType':
      return deal.countertopType ? COUNTERTOP_LABELS[deal.countertopType] : '—'
    case 'finish':
      return deal.finish ?? '—'
    case 'qualityTier':
      return deal.qualityTier ? QUALITY_LABELS[deal.qualityTier] : '—'
    case 'hardwareTier':
      return deal.hardwareTier ? HARDWARE_LABELS[deal.hardwareTier] : '—'
    case 'openingSystem':
      return deal.openingSystem ? OPENING_SYSTEM_LABELS[deal.openingSystem] : '—'
    case 'drawerCount':
      return deal.drawerCount != null ? String(deal.drawerCount) : '—'
    case 'heightCm':
      return deal.heightCm != null ? String(deal.heightCm) : '—'
    case 'depthCm':
      return deal.depthCm != null ? String(deal.depthCm) : '—'
    case 'lengthCm':
      return deal.lengthCm != null ? String(deal.lengthCm) : '—'
  }
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: RevisionFieldKey
  value: string
  onChange: (value: string) => void
}) {
  const options = SELECT_OPTIONS[field]
  if (options) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Новое значение" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(options).map((label) => (
            <SelectItem key={label} value={label}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  return (
    <Input
      type={NUMERIC_FIELDS.has(field) ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Новое значение"
    />
  )
}

export function RevisionRequestForm({
  deal,
  onSubmit,
  onCancel,
}: {
  deal: Deal
  onSubmit: (revisions: RevisionSubmission[], comment: string) => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState<RevisionFieldKey[]>([])
  const [values, setValues] = useState<Partial<Record<RevisionFieldKey, string>>>({})
  const [comment, setComment] = useState('')

  function toggle(field: RevisionFieldKey) {
    setSelected((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]))
  }

  const selectedFields = REVISION_FIELD_ORDER.filter((f) => selected.includes(f))
  const readyFields = selectedFields.filter((f) => (values[f] ?? '').trim().length > 0)
  const canSubmit = readyFields.length > 0

  function handleSubmit() {
    const revisions: RevisionSubmission[] = readyFields.map((f) => ({
      field: f,
      oldValue: currentValue(deal, f),
      newValue: (values[f] ?? '').trim(),
    }))
    onSubmit(revisions, comment.trim())
  }

  return (
    <div className="grid gap-3 rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">Что хотите изменить? Можно выбрать несколько.</p>

      <ToggleChips
        options={REVISION_FIELD_ORDER}
        labels={FIELD_LABELS}
        selected={selected}
        onToggle={toggle}
      />

      {selectedFields.length > 0 && (
        <div className="grid gap-2.5 border-t pt-3">
          {selectedFields.map((field) => (
            <div key={field} className="grid gap-1.5">
              <label className="text-sm font-medium">
                {FIELD_LABELS[field]}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  сейчас: {currentValue(deal, field)}
                </span>
              </label>
              <FieldInput
                field={field}
                value={values[field] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [field]: v }))}
              />
            </div>
          ))}
        </div>
      )}

      <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий (необязательно)" />
      <div className="flex gap-2">
        <Button disabled={!canSubmit} onClick={handleSubmit}>
          Отправить правки
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
