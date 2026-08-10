import { generateId } from './id'
import { REVISION_FIELD_LABELS } from './orderSpecLabels'
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
