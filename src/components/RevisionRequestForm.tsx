import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORY_LABELS, HARDWARE_LABELS, MATERIAL_LABELS, QUALITY_LABELS } from '../domain/orderSpecLabels'
import type { Deal } from '../domain/types'

export type RevisionFieldKey =
  | 'amount'
  | 'deadline'
  | 'category'
  | 'material'
  | 'finish'
  | 'qualityTier'
  | 'hardwareTier'
  | 'widthCm'
  | 'heightCm'
  | 'depthCm'
  | 'lengthCm'

export interface RevisionSubmission {
  field: RevisionFieldKey
  oldValue: string
  newValue: string
}

const NUMERIC_FIELDS = new Set<RevisionFieldKey>(['amount', 'deadline', 'widthCm', 'heightCm', 'depthCm', 'lengthCm'])
const SELECT_OPTIONS: Partial<Record<RevisionFieldKey, Record<string, string>>> = {
  category: CATEGORY_LABELS,
  material: MATERIAL_LABELS,
  qualityTier: QUALITY_LABELS,
  hardwareTier: HARDWARE_LABELS,
}

const FIELD_GROUPS: { key: RevisionFieldKey; label: string }[] = [
  { key: 'amount', label: 'Сумма' },
  { key: 'deadline', label: 'Срок изготовления' },
  { key: 'category', label: 'Тип мебели' },
  { key: 'material', label: 'Материал' },
  { key: 'finish', label: 'Цвет / отделка' },
  { key: 'qualityTier', label: 'Качество' },
  { key: 'hardwareTier', label: 'Фурнитура' },
  { key: 'widthCm', label: 'Ширина, см' },
  { key: 'heightCm', label: 'Высота, см' },
  { key: 'depthCm', label: 'Глубина, см' },
  { key: 'lengthCm', label: 'Длина, см' },
]

function currentValue(deal: Deal, field: RevisionFieldKey): string {
  switch (field) {
    case 'amount':
      return String(deal.amount)
    case 'deadline':
      return deal.estimatedProductionDays != null ? String(deal.estimatedProductionDays) : '—'
    case 'category':
      return deal.category ? CATEGORY_LABELS[deal.category] : '—'
    case 'material':
      return deal.material ? MATERIAL_LABELS[deal.material] : '—'
    case 'finish':
      return deal.finish ?? '—'
    case 'qualityTier':
      return deal.qualityTier ? QUALITY_LABELS[deal.qualityTier] : '—'
    case 'hardwareTier':
      return deal.hardwareTier ? HARDWARE_LABELS[deal.hardwareTier] : '—'
    case 'widthCm':
      return deal.widthCm != null ? String(deal.widthCm) : '—'
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
  const [selected, setSelected] = useState<Set<RevisionFieldKey>>(new Set())
  const [values, setValues] = useState<Partial<Record<RevisionFieldKey, string>>>({})
  const [comment, setComment] = useState('')

  function toggle(field: RevisionFieldKey, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(field)
      else next.delete(field)
      return next
    })
  }

  const readyFields = [...selected].filter((f) => (values[f] ?? '').trim().length > 0)
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
      <p className="text-xs text-muted-foreground">
        Отметьте, что хотите изменить, и укажите новое значение — можно выбрать сразу несколько полей.
      </p>
      <div className="grid gap-2">
        {FIELD_GROUPS.map(({ key, label }) => (
          <div key={key} className="grid gap-2 rounded-md border p-2.5">
            <label className="flex items-center justify-between gap-2 text-sm font-medium">
              <span className="flex items-center gap-2">
                {label}
                <span className="text-xs font-normal text-muted-foreground">сейчас: {currentValue(deal, key)}</span>
              </span>
              <Switch checked={selected.has(key)} onCheckedChange={(checked) => toggle(key, checked)} />
            </label>
            {selected.has(key) && (
              <FieldInput
                field={key}
                value={values[key] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
              />
            )}
          </div>
        ))}
      </div>
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
