import { Money } from './Money'
import { PRE_ACCEPTANCE_SHARE_CAP } from '../domain/dealLimits'
import { formatDate } from '../domain/statusLabels'
import type { Deal, Transaction } from '../domain/types'
import { cn } from '@/lib/utils'

type TrancheState = 'reserved' | 'released' | 'pending'

interface Tranche {
  key: 'prepayment' | 'interim' | 'final'
  label: string
  percent: number
  amount: number
  state: TrancheState
  releasedAt?: string
}

/**
 * Блок «Деньги» клиентского листа (дизайн-спека, разделы 4 и 5.1).
 *
 * Стоит выше блока «Сейчас» сознательно: первый вопрос человека, отдавшего половину стоимости
 * кухни незнакомой площадке, — про деньги, а не про процесс. Состояние передаётся текстом и
 * цветом рамки, без иконок: щиты и замки запрещены разделом 2 спеки.
 */
export function DealMoneyBoard({ deal, transactions }: { deal: Deal; transactions: Transaction[] }) {
  const paidOf = (type: Transaction['type']) => transactions.find((t) => t.dealId === deal.id && t.type === type)

  const share = (percent: number) => Math.round((deal.amount * percent) / 100)
  // Деньги удержаны только после фактической оплаты. Проверять «статус не черновик» нельзя:
  // подписание и ожидание оплаты идут до списания, и блок утверждал бы, что сумма уже на
  // защищённом счёте, ровно на том экране, где клиент ещё только решает платить.
  const moneyIsHeld = deal.statusHistory.some((entry) => entry.status === 'paid')

  const tranches: Tranche[] = []
  const pushTranche = (key: Tranche['key'], label: string, percent: number) => {
    if (percent <= 0) return
    const paid = paidOf(key)
    tranches.push({
      key,
      label,
      percent,
      amount: share(percent),
      state: paid ? 'released' : moneyIsHeld ? 'reserved' : 'pending',
      releasedAt: paid?.paidAt,
    })
  }
  pushTranche('prepayment', 'Транш 1', deal.prepaymentPercent)
  pushTranche('interim', 'Транш 2', deal.interimPercent)
  pushTranche('final', tranches.length === 2 ? 'Транш 3' : 'Транш 2', deal.finalPercent)

  const heldAmount = tranches
    .filter((t) => t.state !== 'released')
    .reduce((sum, t) => sum + t.amount, 0)
  const preAcceptanceAmount = share(deal.prepaymentPercent + deal.interimPercent)

  return (
    <section className="border border-border bg-card" aria-labelledby="money-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-5 py-4">
        <h2
          id="money-heading"
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3"
        >
          Где ваши деньги
        </h2>
        <Money amount={deal.amount} className="text-xl font-semibold" />
      </div>

      <div className="grid gap-[3px] p-5 sm:grid-cols-2">
        {tranches.map((tranche) => (
          <div
            key={tranche.key}
            className={cn(
              'border px-4 py-3',
              tranche.state === 'reserved' && 'border-info bg-reserve-soft',
              tranche.state === 'released' && 'border-success bg-released-soft',
              tranche.state === 'pending' && 'border-dashed border-border bg-transparent',
            )}
          >
            <div className="font-mono text-[11px] tracking-[0.1em] text-ink-3">
              {tranche.label} · {tranche.percent}%
            </div>
            <Money amount={tranche.amount} className="mt-1 block text-[17px] font-semibold" />
            <div
              className={cn(
                'mt-1.5 text-[12.5px] font-medium leading-snug',
                tranche.state === 'reserved' && 'text-info',
                tranche.state === 'released' && 'text-success',
                tranche.state === 'pending' && 'text-ink-3',
              )}
            >
              {tranche.state === 'reserved' && 'Заморожен на счёте'}
              {tranche.state === 'released' &&
                `Переведён производителю${tranche.releasedAt ? ` ${formatDate(tranche.releasedAt)}` : ''}`}
              {tranche.state === 'pending' && 'Спишется вместе со всей суммой при оплате'}
            </div>
          </div>
        ))}
      </div>

      {/* Пояснение обычным языком, что означает текущая расстановка денег (спека, 5.1).
          Формулировка обязана совпадать с фактическим обязательством: клиент принимает
          решение об оплате именно по этой строке (FR-08). */}
      <div className="border-t border-border px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
        {moneyIsHeld ? (
          <p className="border-l-2 border-border pl-3">
            {heldAmount > 0 ? (
              <>
                На защищённом счёте остаётся <Money amount={heldAmount} className="text-foreground" />.
                Производитель не может получить эти деньги, пока вы не примете работу.
              </>
            ) : (
              <>Расчёт по сделке закрыт полностью.</>
            )}
          </p>
        ) : (
          <div className="grid gap-2 border-l-2 border-border pl-3">
            <p>
              Вся сумма списывается одним платежом и замораживается на счёте платформы. До приёмки
              производитель получит <Money amount={preAcceptanceAmount} className="text-foreground" /> —{' '}
              {deal.prepaymentPercent + deal.interimPercent}% от суммы. Больше{' '}
              {PRE_ACCEPTANCE_SHARE_CAP}% до приёмки не переводится ни в одной сделке.
            </p>
            <p className="text-foreground">
              Если работа не будет принята, Asia Mebel возвращает вам всю сумму сделки —{' '}
              <Money amount={deal.amount} className="text-foreground" />, включая уже переведённую
              производителю часть. Разницу платформа покрывает из собственного резерва.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
