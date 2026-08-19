import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import { GUARANTEE_RESERVE_LIMIT, calculateGuaranteeReserve, dealsOccupyingReserve } from './guaranteeReserve'
import type { CreateDealInput, Deal, DealStatus, Transaction } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур на заказ',
  amount: 500_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 10,
}

function dealWith(status: DealStatus, amount = 500_000, id?: string): Deal {
  return { ...createDeal({ ...baseInput, amount, id }), status }
}

function payout(dealId: string, amount: number, type: Transaction['type'] = 'prepayment'): Transaction {
  return { dealId, type, amount, status: 'paid', paidAt: new Date().toISOString() }
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

describe('GUARANTEE_RESERVE_LIMIT', () => {
  it('резервный фонд платформы — 5 млн ₸ (решение PM, раздел 3.3 PRD)', () => {
    expect(GUARANTEE_RESERVE_LIMIT).toBe(5_000_000)
  })
})

describe('calculateGuaranteeReserve (FR-38)', () => {
  it('на пустом списке сделок возвращает лимит целиком доступным', () => {
    expect(calculateGuaranteeReserve([], [])).toEqual({
      limit: GUARANTEE_RESERVE_LIMIT,
      used: 0,
      available: GUARANTEE_RESERVE_LIMIT,
    })
  })

  it('экспозиция — это выплаченные транши, а не полная сумма сделки', () => {
    const deal = dealWith('in_production', 500_000, 'd-1')
    const { used } = calculateGuaranteeReserve([deal], [payout('d-1', 225_000)])
    expect(used).toBe(225_000)
  })

  it('активная сделка без выплат не занимает резерв: платформа ещё ничем не рискует', () => {
    const deal = dealWith('negotiation', 500_000, 'd-1')
    expect(calculateGuaranteeReserve([deal], []).used).toBe(0)
  })

  it.each(NON_RESERVE_STATUSES)('выплаты по сделке в статусе %s выходят из экспозиции', (status) => {
    const deal = dealWith(status, 500_000, 'd-1')
    const { used } = calculateGuaranteeReserve([deal], [payout('d-1', 225_000)])
    expect(used).toBe(0)
  })

  it.each(RESERVE_STATUSES)('выплаты по сделке в статусе %s входят в экспозицию', (status) => {
    const deal = dealWith(status, 500_000, 'd-1')
    const { used } = calculateGuaranteeReserve([deal], [payout('d-1', 225_000)])
    expect(used).toBe(225_000)
  })

  it('несколько траншей по одной сделке суммируются', () => {
    const deal = dealWith('in_production', 500_000, 'd-1')
    const transactions = [payout('d-1', 135_000), payout('d-1', 90_000, 'interim')]
    expect(calculateGuaranteeReserve([deal], transactions).used).toBe(225_000)
  })

  it('транши сделок, которых нет в списке, в экспозицию не попадают', () => {
    const deal = dealWith('in_production', 500_000, 'd-1')
    const transactions = [payout('d-1', 225_000), payout('d-2', 400_000)]
    expect(calculateGuaranteeReserve([deal], transactions).used).toBe(225_000)
  })

  it('available = limit - used, включая отрицательное значение при превышении лимита', () => {
    const deal = dealWith('in_production', 9_000_000, 'd-1')
    const { available } = calculateGuaranteeReserve([deal], [payout('d-1', GUARANTEE_RESERVE_LIMIT + 300_000)])
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
