import { stepGuidance } from '../domain/stepGuidance'
import type { Actor, DealStatus } from '../domain/types'

export function StepGuidanceCard({ status, actor }: { status: DealStatus; actor: Actor }) {
  const entry = stepGuidance[status]?.[actor]
  if (!entry) return null

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="text-sm font-semibold">{entry.title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
      {entry.action && (
        <div className="mt-2 text-xs font-medium text-info">Требуется от вас: {entry.action}</div>
      )}
      <div className="mt-2 text-xs text-muted-foreground">Зачем этот шаг: {entry.goal}</div>
    </div>
  )
}
