import { formatDate, formatDateTime } from '../domain/statusLabels'
import { isAcceptanceWindowExpired } from '../domain/acceptanceWindow'
import { acceptanceReminders } from '../domain/acceptanceReminders'
import { Money } from './Money'
import type { Deal } from '../domain/types'

function humanizeRemaining(deadlineIso: string): string {
  const diffMs = new Date(deadlineIso).getTime() - Date.now()
  if (diffMs <= 0) return 'срок истёк'

  const hours = Math.floor(diffMs / (60 * 60 * 1000))
  const days = Math.floor(hours / 24)
  const restHours = hours % 24

  // Без завершающей точки: строка встраивается в предложение, которое ставит её само.
  if (days > 0) return `осталось ${days} дн. ${restHours} ч`
  if (hours > 0) return `осталось ${hours} ч`
  return 'осталось меньше часа'
}

/**
 * Блок «Если ничего не делать» (дизайн-спека, 5.3). Обязателен во всех состояниях с таймаутом.
 *
 * Спека называет его ключевым элементом экрана: он снимает главный страх клиента — что деньги
 * уйдут молча. Сворачивать его в тултип, прятать за иконкой с таймером или убирать запрещено.
 */
export function AcceptanceDeadline({ deal, finalAmount }: { deal: Deal; finalAmount: number }) {
  if (!deal.acceptanceDeadline) return null

  const expired = isAcceptanceWindowExpired(deal.acceptanceDeadline)
  const declaredAt = deal.statusHistory.find((h) => h.status === 'awaiting_acceptance')?.at
  const reminders =
    declaredAt && !expired ? acceptanceReminders(declaredAt, deal.acceptanceDeadline) : []

  return (
    <div className="flex flex-col gap-2 border-t border-dashed border-border pt-3.5 sm:flex-row sm:gap-3">
      <span className="shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-warning">
        Если ничего не делать
      </span>
      <p className="max-w-[52ch] text-[13.5px] leading-relaxed text-muted-foreground">
        {expired ? (
          <>
            Срок истёк — работа может быть принята автоматически, и{' '}
            <Money amount={finalAmount} className="font-semibold text-foreground" /> уйдут
            производителю.
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">
              {formatDateTime(deal.acceptanceDeadline)}
            </span>{' '}
            работа считается принятой автоматически, и{' '}
            <Money amount={finalAmount} className="font-semibold text-foreground" /> уйдут
            производителю. {humanizeRemaining(deal.acceptanceDeadline)}. Если вы нашли недостатки —
            отклоните приёмку с описанием, и отсчёт остановится.
          </>
        )}

        {/* FR-23: клиент заранее знает, когда его окликнут. Молчание может стоить ему денег,
            поэтому график напоминаний показан явно, а не подразумевается. */}
        {reminders.length > 0 && (
          <span className="mt-2 block text-[12.5px] text-ink-3">
            Напомним дважды:{' '}
            {reminders.map((reminder, index) => (
              <span key={reminder.kind}>
                {index > 0 && ', '}
                {formatDate(reminder.at)} — {reminder.text}
              </span>
            ))}
            .
          </span>
        )}
      </p>
    </div>
  )
}
