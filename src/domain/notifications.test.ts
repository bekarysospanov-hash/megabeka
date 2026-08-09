import { describe, expect, it } from 'vitest'
import { buildNotificationEvents } from './notifications'
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
