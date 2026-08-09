import { describe, expect, it } from 'vitest'
import { STATUS_LABELS } from './statusLabels'
import { stepGuidance } from './stepGuidance'
import type { Actor, DealStatus } from './types'

const ALL_STATUSES = Object.keys(STATUS_LABELS) as DealStatus[]

describe('stepGuidance', () => {
  it('содержит запись для мебельщика на каждом статусе графа', () => {
    for (const status of ALL_STATUSES) {
      expect(stepGuidance[status]?.furniture_maker, `furniture_maker @ ${status}`).toBeTruthy()
    }
  })

  it('содержит запись для клиента на каждом статусе, где клиент видит экран сделки (кроме draft — клиент туда не заходит)', () => {
    for (const status of ALL_STATUSES.filter((s) => s !== 'draft')) {
      expect(stepGuidance[status]?.client, `client @ ${status}`).toBeTruthy()
    }
  })

  it('содержит запись для оператора на каждом статусе графа (доступны через ручной выбор статуса)', () => {
    for (const status of ALL_STATUSES) {
      expect(stepGuidance[status]?.operator, `operator @ ${status}`).toBeTruthy()
    }
  })

  it('каждая запись содержит непустые title, description и goal', () => {
    for (const status of ALL_STATUSES) {
      for (const actor of ['client', 'furniture_maker', 'operator'] as Actor[]) {
        const entry = stepGuidance[status]?.[actor]
        if (!entry) continue
        expect(entry.title.trim().length, `title @ ${status}/${actor}`).toBeGreaterThan(0)
        expect(entry.description.trim().length, `description @ ${status}/${actor}`).toBeGreaterThan(0)
        expect(entry.goal.trim().length, `goal @ ${status}/${actor}`).toBeGreaterThan(0)
      }
    }
  })
})
