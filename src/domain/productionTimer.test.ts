import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import { getProductionDeadline } from './productionTimer'
import type { CreateDealInput, Deal } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Шкаф-купе',
  amount: 500_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 10,
}

function dealInProduction(estimatedProductionDays: number | null, startedAt: string): Deal {
  const deal = createDeal({ ...baseInput, estimatedProductionDays })
  return {
    ...deal,
    status: 'in_production',
    statusHistory: [...deal.statusHistory, { status: 'in_production', at: startedAt }],
  }
}

describe('getProductionDeadline', () => {
  it('возвращает null, если сделка не проходила через in_production', () => {
    const deal = createDeal({ ...baseInput, estimatedProductionDays: 10 })
    expect(getProductionDeadline(deal)).toBeNull()
  })

  it('возвращает null, если estimatedProductionDays не задан', () => {
    const deal = dealInProduction(null, new Date().toISOString())
    expect(getProductionDeadline(deal)).toBeNull()
  })

  it('startedAt соответствует записи in_production из statusHistory', () => {
    const startedAt = '2026-08-01T00:00:00.000Z'
    const deal = dealInProduction(10, startedAt)
    expect(getProductionDeadline(deal)?.startedAt).toBe(startedAt)
  })

  it('deadlineAt = startedAt + estimatedProductionDays дней', () => {
    const startedAt = '2026-08-01T00:00:00.000Z'
    const deal = dealInProduction(10, startedAt)
    expect(getProductionDeadline(deal)?.deadlineAt).toBe('2026-08-11T00:00:00.000Z')
  })

  it('daysRemaining положительный и overdue=false, если дедлайн ещё не наступил', () => {
    const startedAt = new Date().toISOString()
    const deal = dealInProduction(10, startedAt)
    const result = getProductionDeadline(deal)
    expect(result?.daysRemaining).toBeGreaterThan(0)
    expect(result?.overdue).toBe(false)
  })

  it('daysRemaining отрицательный и overdue=true, если дедлайн прошёл', () => {
    const startedAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    const deal = dealInProduction(10, startedAt)
    const result = getProductionDeadline(deal)
    expect(result?.daysRemaining).toBeLessThan(0)
    expect(result?.overdue).toBe(true)
  })
})
