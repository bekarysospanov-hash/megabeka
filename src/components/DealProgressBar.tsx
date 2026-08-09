import { PROGRESS_STAGES, getProgressStageIndex } from '../domain/progressStages'
import { STATUS_LABELS } from '../domain/statusLabels'
import { cn } from '@/lib/utils'
import type { DealStatus } from '../domain/types'

export function DealProgressBar({ status }: { status: DealStatus }) {
  const stageIndex = getProgressStageIndex(status)

  if (stageIndex === null) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
        {STATUS_LABELS[status]} — обычный ход сделки приостановлен.
      </div>
    )
  }

  const currentStage = PROGRESS_STAGES[stageIndex]

  return (
    <div className="grid gap-1.5">
      <div className="flex gap-1">
        {PROGRESS_STAGES.map((stage, i) => (
          <div
            key={stage.key}
            className={cn('h-1.5 flex-1 rounded-full', i <= stageIndex ? 'bg-primary' : 'bg-muted')}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Этап {stageIndex + 1} из {PROGRESS_STAGES.length}:{' '}
        <span className="font-medium text-foreground">{currentStage.label}</span>
      </div>
    </div>
  )
}
