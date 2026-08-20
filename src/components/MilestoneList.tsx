import { Button } from '@/components/ui/button'
import { Money } from './Money'
import { useDemoActions } from '../store/DemoProvider'
import { canTakeMilestoneAdvance, milestoneAmount, nextClaimableMilestone } from '../domain/milestones'
import { formatDate } from '../domain/statusLabels'
import type { Deal, Milestone } from '../domain/types'
import { cn } from '@/lib/utils'

/**
 * Этапы сделки (FR-03). Деньги раскрываются не автоматически при оплате, а по мере того, как
 * мебельщик берёт транш под очередной этап: первый — закуп материалов, и деньги на него нужны
 * до закупа, иначе мастерская финансирует заказ из своего кармана.
 *
 * Оператор в этом списке действий не имеет: ход работ платформа не проверяет, её точка контроля —
 * движение денег, то есть подтверждение вывода в очереди запросов на перевод (FR-35).
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
  const { takeMilestoneAdvance } = useDemoActions()

  if (milestones.length === 0) return null

  const claimable = nextClaimableMilestone(milestones)
  // Тем же правилом, что и домен: в споре, на замороженной и на закрытой сделке транш не берётся.
  const advanceAllowed = canTakeMilestoneAdvance(deal.status, deal.frozen)

  return (
    <section className="grid gap-2">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">Этапы работ</h2>

      <div className="grid gap-[3px]">
        {milestones.map((milestone) => {
          const isClaimable = claimable?.orderNo === milestone.orderNo

          return (
            <div
              key={milestone.orderNo}
              className={cn(
                'border px-4 py-3',
                milestone.status === 'confirmed' && 'border-success bg-released-soft',
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
                  milestone.status === 'planned' && 'text-ink-3',
                )}
              >
                {milestone.status === 'confirmed' &&
                  (milestone.isFinal
                    ? 'Закрыт приёмкой заказа'
                    : `Транш взят${milestone.confirmedAt ? ` ${formatDate(milestone.confirmedAt)}` : ''} — деньги доступны производителю`)}
                {milestone.status === 'planned' &&
                  (milestone.isFinal
                    ? 'Закроется, когда клиент примет заказ'
                    : 'Транш ещё не взят')}
              </div>

              {role === 'furniture_maker' && isClaimable && advanceAllowed && (
                <Button
                  size="sm"
                  className="mt-2.5"
                  onClick={() => takeMilestoneAdvance(deal.id, milestone.orderNo)}
                >
                  {milestone.orderNo === 1 ? 'Взять транш на закуп материалов' : 'Взять транш по этапу'}
                </Button>
              )}

              {role === 'furniture_maker' &&
                milestone.status === 'confirmed' &&
                !milestone.isFinal &&
                advanceAllowed && (
                  <p className="mt-1.5 text-[12.5px] text-ink-3">
                    Деньги на балансе сделки — запросите перевод на свой счёт в блоке «Баланс».
                  </p>
                )}

            </div>
          )
        })}
      </div>
    </section>
  )
}
