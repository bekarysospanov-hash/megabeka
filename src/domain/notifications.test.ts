import { describe, expect, it } from 'vitest'
import {
  buildActRejectedNotification,
  buildClientAcceptedNotification,
  buildInterimPaidNotification,
  buildNotificationEvents,
  buildPaymentRetryNotification,
  buildRevisionRequestedNotification,
  buildRevisionsRequestedNotification,
  buildMilestoneTakenNotification,
  buildTransferExecutedNotification,
  buildTransferRejectedNotification,
} from './notifications'
import { REVISION_FIELD_LABELS } from './orderSpecLabels'
import { formatMoney } from './statusLabels'
import { stepGuidance } from './stepGuidance'
import type { Actor } from './types'

describe('buildNotificationEvents', () => {
  it('создаёт по одному событию на каждого актёра с записью в stepGuidance для статуса', () => {
    const events = buildNotificationEvents('deal-1', 'negotiation')
    const actorsWithGuidance = (['client', 'furniture_maker', 'operator'] as Actor[]).filter(
      (actor) => stepGuidance.negotiation?.[actor],
    )
    expect(events).toHaveLength(actorsWithGuidance.length)
    for (const event of events) {
      expect(event.dealId).toBe('deal-1')
      expect(event.status).toBe('negotiation')
      expect(event.read).toBe(false)
    }
  })

  it('текст события совпадает с title соответствующей записи stepGuidance', () => {
    const events = buildNotificationEvents('deal-1', 'payment_pending')
    for (const event of events) {
      const entry = stepGuidance.payment_pending?.[event.recipientRole]
      expect(event.text).toBe(entry?.title)
    }
  })
})

describe('buildClientAcceptedNotification', () => {
  it('адресовано мебельщику и оператору, у обоих текст отличается от общего текста статуса negotiation', () => {
    const events = buildClientAcceptedNotification('deal-1')
    expect(events.map((e) => e.recipientRole).sort()).toEqual(['furniture_maker', 'operator'])
    for (const event of events) {
      expect(event.dealId).toBe('deal-1')
      expect(event.read).toBe(false)
      expect(event.text).not.toBe(stepGuidance.negotiation?.[event.recipientRole]?.title)
    }
  })
})

describe('buildPaymentRetryNotification', () => {
  it('адресовано мебельщику и оператору, у обоих текст отличается от общего текста статуса payment_pending', () => {
    const events = buildPaymentRetryNotification('deal-1')
    expect(events.map((e) => e.recipientRole).sort()).toEqual(['furniture_maker', 'operator'])
    for (const event of events) {
      expect(event.dealId).toBe('deal-1')
      expect(event.status).toBe('payment_pending')
      expect(event.read).toBe(false)
      expect(event.text).not.toBe(stepGuidance.payment_pending?.[event.recipientRole]?.title)
    }
  })
})

describe('buildRevisionRequestedNotification', () => {
  it('адресовано мебельщику и оператору, оба текста содержат понятное название изменённого поля', () => {
    const events = buildRevisionRequestedNotification('deal-1', 'amount')
    expect(events.map((e) => e.recipientRole).sort()).toEqual(['furniture_maker', 'operator'])
    for (const event of events) {
      expect(event.dealId).toBe('deal-1')
      expect(event.read).toBe(false)
      expect(event.text).toContain(REVISION_FIELD_LABELS.amount)
    }
  })

  it('для незнакомого поля не падает — использует само значение field как есть', () => {
    const events = buildRevisionRequestedNotification('deal-1', 'custom_field')
    for (const event of events) {
      expect(event.text).toContain('custom_field')
    }
  })
})

describe('buildActRejectedNotification', () => {
  it('адресовано мебельщику и оператору, у обоих текст отличается от общего текста статуса in_production', () => {
    const events = buildActRejectedNotification('deal-1', 'скол на дверце')
    expect(events.map((e) => e.recipientRole).sort()).toEqual(['furniture_maker', 'operator'])
    for (const event of events) {
      expect(event.dealId).toBe('deal-1')
      expect(event.status).toBe('in_production')
      expect(event.read).toBe(false)
      expect(event.text).toContain('скол на дверце')
      expect(event.text).not.toBe(stepGuidance.in_production?.[event.recipientRole]?.title)
    }
  })

  it('без причины не падает и не оставляет пустых кавычек в тексте', () => {
    const events = buildActRejectedNotification('deal-1', null)
    for (const event of events) {
      expect(event.text).not.toContain('«')
    }
  })
})

describe('buildInterimPaidNotification', () => {
  it('адресовано мебельщику и оператору, у обоих текст отличается от общего текста статуса in_production', () => {
    const events = buildInterimPaidNotification('deal-1')
    expect(events.map((e) => e.recipientRole).sort()).toEqual(['furniture_maker', 'operator'])
    for (const event of events) {
      expect(event.dealId).toBe('deal-1')
      expect(event.status).toBe('in_production')
      expect(event.read).toBe(false)
      expect(event.text).not.toBe(stepGuidance.in_production?.[event.recipientRole]?.title)
    }
  })
})

describe('buildRevisionsRequestedNotification', () => {
  it('одно уведомление на обоих получателей перечисляет все изменённые поля', () => {
    const events = buildRevisionsRequestedNotification('deal-1', ['amount', 'heightMm'])
    expect(events.map((e) => e.recipientRole).sort()).toEqual(['furniture_maker', 'operator'])
    for (const event of events) {
      expect(event.text).toContain(REVISION_FIELD_LABELS.amount)
      expect(event.text).toContain(REVISION_FIELD_LABELS.heightMm)
    }
  })
})

describe('buildTransferExecutedNotification', () => {
  it('адресовано мебельщику, называет сумму и не подменяет текст статуса', () => {
    const events = buildTransferExecutedNotification('deal-1', 'in_production', 200_000)
    expect(events.map((e) => e.recipientRole)).toEqual(['furniture_maker'])
    expect(events[0].dealId).toBe('deal-1')
    expect(events[0].read).toBe(false)
    expect(events[0].text).toContain(formatMoney(200_000))
    expect(events[0].text).not.toBe(stepGuidance.in_production?.furniture_maker?.title)
  })

  // Запрос на перевод живёт на любом статусе после оплаты, поэтому статус приходит извне:
  // захардкоженный in_production врал бы в уведомлении на приёмке и на завершённой сделке.
  it('сохраняет статус сделки, на котором перевод исполнен', () => {
    expect(buildTransferExecutedNotification('deal-1', 'awaiting_acceptance', 1000)[0].status).toBe(
      'awaiting_acceptance',
    )
  })
})

describe('buildTransferRejectedNotification', () => {
  it('адресовано мебельщику и несёт причину отказа: без неё непонятно, что исправлять', () => {
    const events = buildTransferRejectedNotification('deal-1', 'in_production', 200_000, 'реквизиты не совпадают')
    expect(events.map((e) => e.recipientRole)).toEqual(['furniture_maker'])
    expect(events[0].text).toContain('реквизиты не совпадают')
    expect(events[0].text).toContain(formatMoney(200_000))
  })

  it('сохраняет статус сделки, на котором перевод отклонён', () => {
    expect(
      buildTransferRejectedNotification('deal-1', 'completed', 1000, 'причина')[0].status,
    ).toBe('completed')
  })
})

describe('buildMilestoneTakenNotification', () => {
  // Взятие транша не меняет статус сделки, поэтому типовое уведомление по статусу его не покажет:
  // клиент должен узнать, что деньги раскрыты, из отдельного события (FR-15).
  it('уведомляет клиента о раскрытой сумме и остатке под защитой', () => {
    const events = buildMilestoneTakenNotification('deal-1', 'Закуп материалов', 475_000, 500_000)
    const client = events.find((e) => e.recipientRole === 'client')

    expect(client).toBeDefined()
    expect(client!.text).toContain('Закуп материалов')
    expect(client!.text).toContain(formatMoney(475_000))
    expect(client!.text).toContain(formatMoney(500_000))
  })

  it('оператору отдельного события нет: ход работ его не касается, деньги он увидит в очереди переводов', () => {
    const events = buildMilestoneTakenNotification('deal-1', 'Закуп материалов', 1000, 1000)
    expect(events.map((e) => e.recipientRole)).not.toContain('operator')
  })
})
