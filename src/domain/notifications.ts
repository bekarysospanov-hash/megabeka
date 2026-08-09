import { generateId } from './id'
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
