import { cn } from '@/lib/utils'

export function ToggleChips<T extends string>({
  options,
  labels,
  selected,
  onToggle,
}: {
  options: T[]
  labels: Record<T, string>
  selected: T[]
  onToggle: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:border-primary/40 hover:bg-accent/40',
            )}
          >
            {labels[opt]}
          </button>
        )
      })}
    </div>
  )
}
