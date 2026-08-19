import { generateId } from './id'
import { REVISION_FIELD_LABELS } from './orderSpecLabels'
import { formatMoney } from './statusLabels'
import { stepGuidance } from './stepGuidance'
import type { Actor, DealStatus, NotificationEvent } from './types'

const ACTORS: Actor[] = ['client', 'furniture_maker', 'operator']

export function buildNotificationEvents(dealId: string, status: DealStatus): NotificationEvent[] {
  const at = new Date().toISOString()
  const events: NotificationEvent[] = []

  for (const actor of ACTORS) {
    const entry = stepGuidance[status]?.[actor]
    if (!entry) continue
    events.push({
      id: generateId(),
      dealId,
      recipientRole: actor,
      status,
      text: entry.title,
      at,
      read: false,
    })
  }

  return events
}

// negotiation не меняет статус на "клиент согласился"/"клиент запросил правку" — без этих
// отдельных билдеров оба события молча сливаются с общим текстом статуса negotiation
// (buildNotificationEvents его просто повторяет) и мебельщик не видит, что что-то произошло.

export function buildClientAcceptedNotification(dealId: string): NotificationEvent[] {
  const at = new Date().toISOString()
  const base = { dealId, status: 'negotiation' as const, at, read: false }
  return [
    {
      ...base,
      id: generateId(),
      recipientRole: 'furniture_maker',
      text: 'Клиент согласился с условиями — можно подписывать договор',
    },
    {
      ...base,
      id: generateId(),
      recipientRole: 'operator',
      text: 'Клиент согласился с условиями сделки',
    },
  ]
}

export function buildDealUpdatedNotification(dealId: string): NotificationEvent[] {
  const at = new Date().toISOString()
  const base = { dealId, status: 'negotiation' as const, at, read: false }
  return [
    {
      ...base,
      id: generateId(),
      recipientRole: 'client',
      text: 'Мебельщик обновил условия сделки — проверьте, пожалуйста',
    },
    {
      ...base,
      id: generateId(),
      recipientRole: 'operator',
      text: 'Мебельщик обновил условия сделки по запросу клиента',
    },
  ]
}

// payment_processing -> payment_pending при retryPayment — обычный notify() по статусу
// повторил бы тот же текст, что уже приходил при первом входе в payment_pending, ничего
// не сообщая о неудачной попытке.
export function buildPaymentRetryNotification(dealId: string): NotificationEvent[] {
  const at = new Date().toISOString()
  const base = { dealId, status: 'payment_pending' as const, at, read: false }
  return [
    {
      ...base,
      id: generateId(),
      recipientRole: 'furniture_maker',
      text: 'Оплата не прошла — клиент выбирает способ оплаты заново',
    },
    {
      ...base,
      id: generateId(),
      recipientRole: 'operator',
      text: 'Оплата не прошла — клиент повторяет попытку',
    },
  ]
}

export function buildRevisionRequestedNotification(dealId: string, field: string): NotificationEvent[] {
  const label = REVISION_FIELD_LABELS[field] ?? field
  const at = new Date().toISOString()
  const base = { dealId, status: 'negotiation' as const, at, read: false }
  return [
    { ...base, id: generateId(), recipientRole: 'furniture_maker', text: `Клиент запросил изменение: ${label}` },
    {
      ...base,
      id: generateId(),
      recipientRole: 'operator',
      text: `Клиент запросил изменение условий сделки: ${label}`,
    },
  ]
}

// rejectAct возвращает сделку в in_production, не создавая новый статус — без отдельного
// билдера мебельщик увидел бы тот же общий текст "оплата получена, изделие в производстве",
// как будто ничего не произошло, и не узнал бы, что акт отклонён и почему.
/**
 * FR-15: клиент уведомляется о подтверждении каждого этапа с названием, суммой транша и
 * остатком под защитой. Типовое уведомление по статусу здесь не годится — статус сделки не
 * меняется, и клиент увидел бы дубль «изделие в производстве», из которого не понять, что
 * часть его денег только что ушла мебельщику.
 */
export function buildMilestoneConfirmedNotification(
  dealId: string,
  milestoneTitle: string,
  payoutAmount: number,
  heldAmount: number,
): NotificationEvent[] {
  const at = new Date().toISOString()
  const base = { dealId, status: 'in_production' as const, at, read: false }
  return [
    {
      ...base,
      id: generateId(),
      recipientRole: 'client',
      text: `Этап «${milestoneTitle}» подтверждён: ${formatMoney(payoutAmount)} переведены производителю, под защитой остаётся ${formatMoney(heldAmount)}`,
    },
    {
      ...base,
      id: generateId(),
      recipientRole: 'furniture_maker',
      text: `Этап «${milestoneTitle}» подтверждён оператором — ${formatMoney(payoutAmount)} доступны к переводу`,
    },
  ]
}

/** FR-14: отклонение этапа с причиной — мебельщик должен понять, что переснять или исправить. */
export function buildMilestoneRejectedNotification(
  dealId: string,
  milestoneTitle: string,
  reason: string,
): NotificationEvent[] {
  return [
    {
      dealId,
      status: 'in_production' as const,
      at: new Date().toISOString(),
      read: false,
      id: generateId(),
      recipientRole: 'furniture_maker',
      text: `Этап «${milestoneTitle}» отклонён оператором: «${reason}»`,
    },
  ]
}

/** Заявление этапа: задача оператору на проверку (FR-13). */
export function buildMilestoneDeclaredNotification(
  dealId: string,
  milestoneTitle: string,
): NotificationEvent[] {
  return [
    {
      dealId,
      status: 'in_production' as const,
      at: new Date().toISOString(),
      read: false,
      id: generateId(),
      recipientRole: 'operator',
      text: `Мебельщик заявил этап «${milestoneTitle}» — проверьте фото и подтвердите`,
    },
  ]
}

export function buildActRejectedNotification(dealId: string, reason: string | null): NotificationEvent[] {
  const at = new Date().toISOString()
  const base = { dealId, status: 'in_production' as const, at, read: false }
  const suffix = reason ? `: «${reason}»` : ''
  return [
    {
      ...base,
      id: generateId(),
      recipientRole: 'furniture_maker',
      text: `Клиент отклонил приёмку${suffix}`,
    },
    {
      ...base,
      id: generateId(),
      recipientRole: 'operator',
      text: `Клиент отклонил акт приёма-передачи${suffix}`,
    },
  ]
}

// Подтверждение этапа не меняет статус сделки (остаётся in_production) — без отдельного билдера
// событие вообще не попало бы в центр уведомлений.
export function buildInterimPaidNotification(dealId: string): NotificationEvent[] {
  const at = new Date().toISOString()
  const base = { dealId, status: 'in_production' as const, at, read: false }
  return [
    {
      ...base,
      id: generateId(),
      recipientRole: 'furniture_maker',
      text: 'Промежуточный транш открыт — доступен для запроса перевода',
    },
    {
      ...base,
      id: generateId(),
      recipientRole: 'operator',
      text: 'Мебельщик запросил доступность промежуточного транша по сделке',
    },
  ]
}

export function buildRevisionsRequestedNotification(dealId: string, fields: string[]): NotificationEvent[] {
  const labels = fields.map((f) => REVISION_FIELD_LABELS[f] ?? f).join(', ')
  const at = new Date().toISOString()
  const base = { dealId, status: 'negotiation' as const, at, read: false }
  return [
    { ...base, id: generateId(), recipientRole: 'furniture_maker', text: `Клиент запросил изменения: ${labels}` },
    {
      ...base,
      id: generateId(),
      recipientRole: 'operator',
      text: `Клиент запросил изменения условий сделки: ${labels}`,
    },
  ]
}

// Статус сделки передаётся аргументом, а не берётся константой: перевод запрашивают на любом
// статусе после оплаты, и «in_production» врал бы в уведомлении на приёмке или после завершения.

/** FR-35: оператор исполнил запрос — деньги ушли на счёт, мебельщик должен об этом узнать. */
export function buildTransferExecutedNotification(
  dealId: string,
  status: DealStatus,
  amount: number,
): NotificationEvent[] {
  return [
    {
      dealId,
      status,
      at: new Date().toISOString(),
      read: false,
      id: generateId(),
      recipientRole: 'furniture_maker',
      text: `Перевод ${formatMoney(amount)} исполнен — деньги отправлены на ваш счёт`,
    },
  ]
}

/** Отклонение возвращает сумму в доступный баланс, поэтому уведомление обязано нести причину. */
export function buildTransferRejectedNotification(
  dealId: string,
  status: DealStatus,
  amount: number,
  reason: string,
): NotificationEvent[] {
  return [
    {
      dealId,
      status,
      at: new Date().toISOString(),
      read: false,
      id: generateId(),
      recipientRole: 'furniture_maker',
      text: `Запрос перевода на ${formatMoney(amount)} отклонён: «${reason}». Сумма снова доступна к запросу`,
    },
  ]
}
