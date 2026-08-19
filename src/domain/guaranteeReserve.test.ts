import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import {
  GUARANTEE_RESERVE_LIMIT,
  calculateGuaranteeReserve,
  dealRiskAmount,
  dealsOccupyingReserve,
  fitsInReserve,
} from './guaranteeReserve'
import type { CreateDealInput, Deal, DealStatus, Transaction } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур на заказ',
  amount: 800_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 5,
}

function dealWith(status: DealStatus, amount = 800_000, id?: string): Deal {
  return { ...createDeal({ ...baseInput, amount, id }), status }
}

function payout(dealId: string, amount: number): Transaction {
  return { dealId, type: 'prepayment', amount, status: 'paid', paidAt: new Date().toISOString() }
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
  'remedy',
]

describe('GUARANTEE_RESERVE_LIMIT', () => {
  it('резервный фонд платформы — 5 млн ₸ (решение PM, раздел 3.3 PRD)', () => {
    expect(GUARANTEE_RESERVE_LIMIT).toBe(5_000_000)
  })
})

describe('dealRiskAmount', () => {
  it('риск платформы — доля, уходящая мебельщику до приёмки', () => {
    expect(dealRiskAmount(dealWith('negotiation'))).toBe(400_000)
  })

  it('трёхчастная схема считает предоплату и промежуточный транш вместе', () => {
    const deal = {
      ...createDeal({ ...baseInput, prepaymentPercent: 30, interimPercent: 20, finalPercent: 50 }),
      status: 'in_production' as DealStatus,
    }
    expect(dealRiskAmount(deal)).toBe(400_000)
  })

  it('финальная доля в риск не входит: она выплачивается только после приёмки', () => {
    const deal = {
      ...createDeal({ ...baseInput, prepaymentPercent: 20, finalPercent: 80 }),
      status: 'paid' as DealStatus,
    }
    expect(dealRiskAmount(deal)).toBe(160_000)
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

  it('активная сделка занимает резерв сразу, а не после первой выплаты', () => {
    // Суть перехода от реактивной модели: выплат ещё нет, но обязательство уже есть.
    expect(calculateGuaranteeReserve([dealWith('negotiation', 800_000, 'd-1')], []).used).toBe(400_000)
  })

  it('фактическая выплата не удваивает занятое: это те же деньги', () => {
    const deal = dealWith('in_production', 800_000, 'd-1')
    expect(calculateGuaranteeReserve([deal], [payout('d-1', 380_000)]).used).toBe(400_000)
  })

  it('выплата сверх расчётного риска поднимает занятое до фактического', () => {
    const deal = dealWith('in_production', 800_000, 'd-1')
    expect(calculateGuaranteeReserve([deal], [payout('d-1', 500_000)]).used).toBe(500_000)
  })

  it.each(NON_RESERVE_STATUSES)('сделка в статусе %s резерв не занимает', (status) => {
    const deal = dealWith(status, 800_000, 'd-1')
    expect(calculateGuaranteeReserve([deal], [payout('d-1', 380_000)]).used).toBe(0)
  })

  it.each(RESERVE_STATUSES)('сделка в статусе %s занимает резерв на свой риск', (status) => {
    expect(calculateGuaranteeReserve([dealWith(status, 800_000, 'd-1')], []).used).toBe(400_000)
  })

  it('несколько активных сделок суммируют риск', () => {
    const deals = [dealWith('negotiation', 800_000, 'd-1'), dealWith('paid', 400_000, 'd-2')]
    expect(calculateGuaranteeReserve(deals, []).used).toBe(600_000)
  })

  it('транши сделок, которых нет в списке, в экспозицию не попадают', () => {
    const deal = dealWith('in_production', 800_000, 'd-1')
    const transactions = [payout('d-1', 380_000), payout('d-2', 900_000)]
    expect(calculateGuaranteeReserve([deal], transactions).used).toBe(400_000)
  })

  it('available уходит в минус при превышении лимита', () => {
    const deals = Array.from({ length: 14 }, (_, i) => dealWith('in_production', 800_000, `d-${i}`))
    expect(calculateGuaranteeReserve(deals, []).available).toBeLessThan(0)
  })
})

describe('fitsInReserve', () => {
  it('сделка проходит, если её риск помещается в остаток', () => {
    const active = dealWith('in_production', 800_000, 'd-1')
    expect(fitsInReserve([active], [], 2_000_000, 50)).toBe(true)
  })

  it('сделка не проходит, если выведет экспозицию за резерв', () => {
    const active = Array.from({ length: 9 }, (_, i) => dealWith('in_production', 800_000, `d-${i}`))
    expect(fitsInReserve(active, [], 3_000_000, 50)).toBe(false)
  })

  it('проверка идёт до отправки, а не после выплаты — в этом весь смысл', () => {
    const active = Array.from({ length: 12 }, (_, i) => dealWith('negotiation', 800_000, `d-${i}`))
    expect(calculateGuaranteeReserve(active, []).used).toBe(4_800_000)
    expect(fitsInReserve(active, [], 800_000, 50)).toBe(false)
  })

  it('доля выше потолка FR-04 в расчёте риска не учитывается сверх 50%', () => {
    // Схему с 80% до приёмки форма не пропустит, но расчёт не должен на неё полагаться.
    expect(fitsInReserve([], [], 1_000_000, 80)).toBe(true)
    expect(calculateGuaranteeReserve([], []).available).toBe(GUARANTEE_RESERVE_LIMIT)
  })
})

describe('dealsOccupyingReserve', () => {
  it('на пустом списке возвращает пустой список', () => {
    expect(dealsOccupyingReserve([])).toEqual([])
  })

  it('исключает все терминальные статусы и черновик', () => {
    const deals = NON_RESERVE_STATUSES.map((status) => dealWith(status))
    expect(dealsOccupyingReserve(deals)).toEqual([])
  })
})
