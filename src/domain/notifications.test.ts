import { describe, expect, it } from 'vitest'
import {
  buildClientAcceptedNotification,
  buildNotificationEvents,
  buildRevisionRequestedNotification,
} from './notifications'
import { REVISION_FIELD_LABELS } from './orderSpecLabels'
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
