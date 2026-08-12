import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import { dealsNeedingAttention, isDealStalled, STALLED_THRESHOLD_DAYS } from './attention'
import type { CreateDealInput, Deal, DealStatus, RevisionEntry } from './types'

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

function withLastChange(status: DealStatus, daysAgo: number): Deal {
  const at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
  const deal = createDeal(baseInput)
  return { ...deal, status, statusHistory: [...deal.statusHistory, { status, at }] }
}

describe('isDealStalled', () => {
  it('не зависла, если статус менялся недавно', () => {
    const deal = withLastChange('negotiation', 1)
    expect(isDealStalled(deal)).toBe(false)
  })

  it('зависла, если статус не менялся дольше порога', () => {
    const deal = withLastChange('negotiation', STALLED_THRESHOLD_DAYS + 1)
    expect(isDealStalled(deal)).toBe(true)
  })

  it('terminal-статусы (completed/cancelled/cancelled_refunded) никогда не считаются зависшими', () => {
    for (const status of ['completed', 'cancelled', 'cancelled_refunded'] as DealStatus[]) {
      const deal = withLastChange(status, STALLED_THRESHOLD_DAYS + 10)
      expect(isDealStalled(deal)).toBe(false)
    }
  })

  it('dispute_open не считается зависшей — уже подсвечена отдельным сигналом', () => {
    const deal = withLastChange('dispute_open', STALLED_THRESHOLD_DAYS + 10)
    expect(isDealStalled(deal)).toBe(false)
  })

  it('недавняя правка (без смены статуса) считается активностью — сделка не зависла', () => {
    // negotiation допускает N раундов правок без единого перехода statusHistory — если считать
    // только его, активные переговоры ложно попадут в "зависшие" (реальный кейс из /review).
    const deal = withLastChange('negotiation', STALLED_THRESHOLD_DAYS + 5)
    const recentRevision: RevisionEntry = {
      requestId: 'r1',
      dealId: deal.id,
      field: 'amount',
      oldValue: '1',
      newValue: '2',
      comment: '',
      at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
    expect(isDealStalled(deal, [recentRevision])).toBe(false)
  })

  it('старая правка не спасает от статуса "зависла", если и она за порогом', () => {
    const deal = withLastChange('negotiation', STALLED_THRESHOLD_DAYS + 5)
    const oldRevision: RevisionEntry = {
      requestId: 'r1',
      dealId: deal.id,
      field: 'amount',
      oldValue: '1',
      newValue: '2',
      comment: '',
      at: new Date(Date.now() - (STALLED_THRESHOLD_DAYS + 5) * 24 * 60 * 60 * 1000).toISOString(),
    }
    expect(isDealStalled(deal, [oldRevision])).toBe(true)
  })

  it('правки по другим сделкам не влияют на расчёт', () => {
    const deal = withLastChange('negotiation', STALLED_THRESHOLD_DAYS + 5)
    const otherDealsRevision: RevisionEntry = {
      requestId: 'r1',
      dealId: 'other-deal',
      field: 'amount',
      oldValue: '1',
      newValue: '2',
      comment: '',
      at: new Date().toISOString(),
    }
    expect(isDealStalled(deal, [otherDealsRevision])).toBe(true)
  })
})
