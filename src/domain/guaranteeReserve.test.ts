import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import { GUARANTEE_RESERVE_LIMIT, calculateGuaranteeReserve, dealsOccupyingReserve } from './guaranteeReserve'
import type { CreateDealInput, Deal, DealStatus } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур на заказ',
  amount: 500_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 10,
}

function dealWith(status: DealStatus, amount = 500_000): Deal {
  return { ...createDeal({ ...baseInput, amount }), status }
}

const NON_RESERVE_STATUSES: DealStatus[] = ['draft', 'completed', 'cancelled_refunded', 'cancelled']
const RESERVE_STATUSES: DealStatus[] = [
  'awaiting_client',
  'negotiation',
  'contract_signing',
  'contract_signed',
  'payment_pending',
  'payment_processing',
  'paid',
  'in_production',
  'awaiting_acceptance',
  'act_signing',
  'act_signed',
  'dispute_open',
]

describe('calculateGuaranteeReserve', () => {
  it('на пустом списке сделок возвращает лимит целиком доступным', () => {
    expect(calculateGuaranteeReserve([])).toEqual({
      limit: GUARANTEE_RESERVE_LIMIT,
      used: 0,
      available: GUARANTEE_RESERVE_LIMIT,
    })
  })

  it('сделка в draft не увеличивает used', () => {
    const { used } = calculateGuaranteeReserve([dealWith('draft')])
    expect(used).toBe(0)
  })

  it('сделка в completed не увеличивает used', () => {
    const { used } = calculateGuaranteeReserve([dealWith('completed')])
    expect(used).toBe(0)
  })

  it('сделка в cancelled_refunded не увеличивает used', () => {
    const { used } = calculateGuaranteeReserve([dealWith('cancelled_refunded')])
    expect(used).toBe(0)
  })

  it('сделка в cancelled не увеличивает used', () => {
    const { used } = calculateGuaranteeReserve([dealWith('cancelled')])
    expect(used).toBe(0)
  })

  it.each(RESERVE_STATUSES)('сделка в статусе %s увеличивает used на свою сумму', (status) => {
    const { used } = calculateGuaranteeReserve([dealWith(status, 500_000)])
    expect(used).toBe(500_000)
  })

  it('несколько активных сделок суммируются в used', () => {
    const deals = [dealWith('negotiation', 300_000), dealWith('paid', 200_000), dealWith('draft', 999_999)]
    const { used } = calculateGuaranteeReserve(deals)
    expect(used).toBe(500_000)
  })

  it('available = limit - used, включая отрицательное значение при превышении лимита', () => {
    const deals = [dealWith('negotiation', GUARANTEE_RESERVE_LIMIT + 300_000)]
    const { available } = calculateGuaranteeReserve(deals)
    expect(available).toBe(-300_000)
  })
})

describe('dealsOccupyingReserve', () => {
  it('на пустом списке возвращает пустой список', () => {
    expect(dealsOccupyingReserve([])).toEqual([])
  })

  it('возвращает только сделки не в draft/completed/cancelled_refunded', () => {
    const active = dealWith('negotiation')
    const deals = [dealWith('draft'), active, dealWith('completed'), dealWith('cancelled_refunded')]
    const result = dealsOccupyingReserve(deals)
    expect(result).toEqual([active])
  })

  it('исключает все статусы из NON_RESERVE_STATUSES', () => {
    const deals = NON_RESERVE_STATUSES.map((status) => dealWith(status))
    expect(dealsOccupyingReserve(deals)).toEqual([])
  })
})
