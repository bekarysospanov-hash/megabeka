import { describe, expect, it } from 'vitest'
import { acceptanceReminders } from './acceptanceReminders'

const DAY = 24 * 60 * 60 * 1000

describe('acceptanceReminders (FR-23)', () => {
  it('напоминаний ровно два: на половине срока и за рабочий день до конца', () => {
    const declaredAt = new Date(2026, 7, 19, 10, 0)
    const deadline = new Date(2026, 7, 24, 10, 0)
    expect(acceptanceReminders(declaredAt.toISOString(), deadline.toISOString())).toHaveLength(2)
  })

  it('первое приходится на середину окна', () => {
    const declaredAt = new Date(2026, 7, 19, 10, 0)
    const deadline = new Date(2026, 7, 23, 10, 0)
    const [first] = acceptanceReminders(declaredAt.toISOString(), deadline.toISOString())

    expect(new Date(first.at).getTime()).toBe(declaredAt.getTime() + 2 * DAY)
    expect(first.kind).toBe('halfway')
  })

  it('второе — за сутки до истечения, с предупреждением об авто-приёмке', () => {
    const declaredAt = new Date(2026, 7, 19, 10, 0)
    const deadline = new Date(2026, 7, 24, 10, 0)
    const [, last] = acceptanceReminders(declaredAt.toISOString(), deadline.toISOString())

    expect(new Date(last.at).getTime()).toBe(deadline.getTime() - DAY)
    expect(last.kind).toBe('final')
  })

  it('на очень коротком окне напоминания не наезжают друг на друга', () => {
    const declaredAt = new Date(2026, 7, 19, 10, 0)
    const deadline = new Date(2026, 7, 19, 22, 0)
    const reminders = acceptanceReminders(declaredAt.toISOString(), deadline.toISOString())

    const times = reminders.map((r) => new Date(r.at).getTime())
    expect(times[0]).toBeLessThanOrEqual(times[1])
  })

  it('напоминания всегда внутри окна, а не после его истечения', () => {
    const declaredAt = new Date(2026, 7, 19, 10, 0)
    const deadline = new Date(2026, 7, 24, 10, 0)

    for (const reminder of acceptanceReminders(declaredAt.toISOString(), deadline.toISOString())) {
      const at = new Date(reminder.at).getTime()
      expect(at).toBeGreaterThanOrEqual(declaredAt.getTime())
      expect(at).toBeLessThanOrEqual(deadline.getTime())
    }
  })
})
