import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CUSTOM_SENTINEL = '__custom__'

// Дропдаун с готовыми вариантами + опция «Своё...» — переключает на текстовый ввод, если
// подходящего варианта нет в списке. Пустая строка — «не выбрано» (как и у обычных Select
// в этой форме), не null — состояние формы возвращает null на submit, не здесь.
export function SelectWithCustom({
  value,
  onChange,
  options,
  placeholder = 'Не выбрано',
  customPlaceholder = 'Впишите своё значение',
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: Record<string, string>
  placeholder?: string
  customPlaceholder?: string
  className?: string
}) {
  const isKnown = value === '' || value in options
  const [customMode, setCustomMode] = useState(!isKnown)

  if (customMode) {
    return (
      <div className="grid gap-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={customPlaceholder}
          autoFocus
        />
        <button
          type="button"
          className="w-fit text-left text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          onClick={() => {
            setCustomMode(false)
            onChange('')
          }}
        >
          Выбрать из списка
        </button>
      </div>
    )
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === CUSTOM_SENTINEL) {
          setCustomMode(true)
          onChange('')
          return
        }
        onChange(v)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(options).map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
        <SelectItem value={CUSTOM_SENTINEL}>Своё…</SelectItem>
      </SelectContent>
    </Select>
  )
}
