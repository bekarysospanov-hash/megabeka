import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Money } from './Money'
import { useDemoActions } from '../store/DemoProvider'
import { milestoneAmount, nextClaimableMilestone } from '../domain/milestones'
import { formatDate } from '../domain/statusLabels'
import type { Deal, Milestone } from '../domain/types'
import { cn } from '@/lib/utils'

/**
 * Этапы сделки (FR-13, FR-14). Деньги раскрываются мебельщику не автоматически при оплате,
 * а по мере подтверждения этапов оператором — это и есть механика, ради которой пилот
 * существует: клиент видит, что за непроверенную работу платформа не платит.
 *
 * Один компонент на все роли: мебельщик заявляет, оператор подтверждает или отклоняет,
 * клиент только смотрит. Набор действий определяется ролью, а не тремя разными списками.
 */
export function MilestoneList({
  deal,
  milestones,
  role,
}: {
  deal: Deal
  milestones: Milestone[]
  role: 'client' | 'furniture_maker' | 'operator'
}) {
  const { declareMilestone, confirmMilestone, rejectMilestone } = useDemoActions()
  const [rejectingOrderNo, setRejectingOrderNo] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  if (milestones.length === 0) return null

  const claimable = nextClaimableMilestone(milestones)

  return (
    <section className="grid gap-2">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">Этапы работ</h2>

      <div className="grid gap-[3px]">
        {milestones.map((milestone) => {
          const isClaimable = claimable?.orderNo === milestone.orderNo
          const isRejecting = rejectingOrderNo === milestone.orderNo

          return (
            <div
              key={milestone.orderNo}
              className={cn(
                'border px-4 py-3',
                milestone.status === 'confirmed' && 'border-success bg-released-soft',
                milestone.status === 'declared' && 'border-warning bg-wait-soft',
                milestone.status === 'planned' && 'border-dashed border-border',
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] tracking-[0.1em] text-ink-3">
                  Этап {milestone.orderNo} · {milestone.sharePercent}%
                </span>
                <Money amount={milestoneAmount(deal, milestone)} className="text-[15px] font-semibold" />
              </div>

              <div className="mt-0.5 text-sm font-medium">{milestone.title}</div>

              <div
                className={cn(
                  'mt-1 text-[12.5px] leading-snug',
                  milestone.status === 'confirmed' && 'text-success',
                  milestone.status === 'declared' && 'text-warning',
                  milestone.status === 'planned' && 'text-ink-3',
                )}
              >
                {milestone.status === 'confirmed' &&
                  (milestone.isFinal
                    ? 'Закрыт приёмкой заказа'
                    : `Подтверждён${milestone.confirmedAt ? ` ${formatDate(milestone.confirmedAt)}` : ''} — деньги переведены`)}
                {milestone.status === 'declared' && 'Отправлен на проверку оператору'}
                {milestone.status === 'planned' &&
                  (milestone.isFinal
                    ? 'Закроется, когда клиент примет заказ'
                    : 'Ещё не заявлен производителем')}
              </div>

              {milestone.rejectReason && milestone.status === 'planned' && (
                <p className="mt-1.5 text-[12.5px] text-destructive">
                  Оператор отклонил: «{milestone.rejectReason}»
                </p>
              )}

              {role === 'furniture_maker' && isClaimable && (
                <Button
                  size="sm"
                  className="mt-2.5"
                  // Фото в прототипе не загружаются по-настоящему: SMS, платежи и файлы здесь
                  // имитируются. Требование «не менее одного фото» держит домен (FR-13).
                  onClick={() => declareMilestone(deal.id, milestone.orderNo, ['demo-photo'])}
                >
                  Заявить этап с фото
                </Button>
              )}

              {role === 'operator' && milestone.status === 'declared' && !isRejecting && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => confirmMilestone(deal.id, milestone.orderNo)}>
                    Подтвердить и раскрыть транш
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectingOrderNo(milestone.orderNo)
                      setRejectReason('')
                    }}
                  >
                    Отклонить
                  </Button>
                </div>
              )}

              {role === 'operator' && isRejecting && (
                <div className="mt-2.5 grid gap-2">
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Что не так: на фото не видно кромки…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!rejectReason.trim()}
                      onClick={() => {
                        rejectMilestone(deal.id, milestone.orderNo, rejectReason)
                        setRejectingOrderNo(null)
                      }}
                    >
                      Отклонить с причиной
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectingOrderNo(null)}>
                      Отмена
                    </Button>
                  </div>
                  {!rejectReason.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Без причины мебельщик не поймёт, что исправлять.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
