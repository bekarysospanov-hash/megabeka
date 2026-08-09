import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import { dealsNeedingAttention } from './attention'
import type { CreateDealInput, Deal, DealStatus } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Шкаф-купе',
  amount: 500_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 10,
}

function dealWith(status: DealStatus): Deal {
  return { ...createDeal(baseInput), status }
}

function overdueDeal(): Deal {
  const startedAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  const deal = createDeal({ ...baseInput, estimatedProductionDays: 5 })
  return {
    ...deal,
    status: 'in_production',
    statusHistory: [...deal.statusHistory, { status: 'in_production', at: startedAt }],
  }
}

describe('dealsNeedingAttention', () => {
  it('пустой список сделок возвращает пустой результат', () => {
    expect(dealsNeedingAttention([])).toEqual([])
  })

  it('сделка в dispute_open попадает в список', () => {
    const deal = dealWith('dispute_open')
    expect(dealsNeedingAttention([deal])).toEqual([deal])
  })

  it('сделка с просроченным производством попадает в список', () => {
    const deal = overdueDeal()
    expect(dealsNeedingAttention([deal])).toEqual([deal])
  })

  it('сделка без спора и без просрочки не попадает в список', () => {
    const deal = dealWith('negotiation')
    expect(dealsNeedingAttention([deal])).toEqual([])
  })

  it('сделка, ушедшая дальше по графу после просрочки производства, больше не считается требующей внимания', () => {
    const deal = overdueDeal()
    const movedOn = { ...deal, status: 'completed' as DealStatus }
    expect(dealsNeedingAttention([movedOn])).toEqual([])
  })
})
