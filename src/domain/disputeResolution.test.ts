import { describe, expect, it } from 'vitest'
import {
  callOperator,
  clientAccepts,
  createDeal,
  markProductionDone,
  onboardClient,
  pay,
  resolveDispute,
  sendToClient,
  signByClientSms,
  signByFurnitureMaker,
  submitPayment,
} from './dealMachine'
import { availableResolutions, remainderForCraftsman } from './disputeResolution'
import { buildMilestones, takeMilestoneAdvance } from './milestones'
import type { CreateDealInput, Deal, Transaction } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур на заказ',
  amount: 1_000_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 5,
}

function paidDeal(): Deal {
  let deal = createDeal(baseInput)
  deal = sendToClient(deal)
  deal = onboardClient(deal, 'Айгерим', '+77011110000')
  deal = clientAccepts(deal)
  deal = signByFurnitureMaker(deal, '1234')
  deal = signByClientSms(deal, '1234')
  deal = submitPayment(deal, 'card')
  return pay(deal).deal
}

function disputedFrom(status: 'in_production' | 'awaiting_acceptance'): Deal {
  const base = paidDeal()
  const deal =
    status === 'in_production'
      ? base
      : markProductionDone(base, takeMilestoneAdvance(buildMilestones(base), 1, 'in_production', false))
  return callOperator(deal, 'client', 'причина').deal
}

/** Аванс 50% за вычетом 5% комиссии — то, что уже ушло мебельщику к моменту спора. */
function paidOutFor(deal: Deal): Transaction[] {
  return [
    {
      dealId: deal.id,
      type: 'prepayment',
      amount: 475_000,
      status: 'paid',
      paidAt: new Date().toISOString(),
    },
  ]
}

describe('availableResolutions (FR-26)', () => {
  it('из окна приёмки доступны все четыре исхода', () => {
    const deal = disputedFrom('awaiting_acceptance')
    expect(availableResolutions(deal)).toEqual([
      'rejected',
      'partial_refund',
      'full_refund',
      'remedy',
    ])
  })

  it('из производства «устранение недостатков» недоступно: устранять ещё нечего', () => {
    const deal = disputedFrom('in_production')
    expect(availableResolutions(deal)).not.toContain('remedy')
    expect(availableResolutions(deal)).toHaveLength(3)
  })
})

describe('remainderForCraftsman (FR-26)', () => {
  it('остаток = сумма сделки минус возврат минус уже выплаченное', () => {
    expect(remainderForCraftsman(1_000_000, 300_000, 475_000)).toBe(225_000)
  })

  it('отрицательный остаток означает, что возврат больше возможного', () => {
    expect(remainderForCraftsman(1_000_000, 800_000, 475_000)).toBeLessThan(0)
  })
})

describe('resolveDispute: спор отклонён', () => {
  it('возвращает сделку в исходный статус и требует новый срок', () => {
    const deal = disputedFrom('in_production')
    const { deal: restored } = resolveDispute(deal, {
      kind: 'rejected',
      newDeadline: '2026-09-15',
    })

    expect(restored.status).toBe('in_production')
    expect(restored.previousStatus).toBeNull()
    expect(restored.disputeResolution).toBe('rejected')
  })

  it('без нового срока решение не сохраняется: FR-30 иначе откроет спор снова', () => {
    const deal = disputedFrom('in_production')
    expect(() => resolveDispute(deal, { kind: 'rejected', newDeadline: '' })).toThrow(/срок/i)
  })
})

describe('resolveDispute: частичный возврат', () => {
  it('фиксирует сумму возврата и порождает выплату остатка мебельщику', () => {
    const deal = disputedFrom('awaiting_acceptance')
    const { deal: resolved, craftsmanPayout } = resolveDispute(
      deal,
      { kind: 'partial_refund', refundAmount: 300_000, itemFate: 'stays_with_client', removalCostBearer: 'craftsman' },
      paidOutFor(deal),
    )

    expect(resolved.status).toBe('cancelled_refunded')
    expect(resolved.refundAmount).toBe(300_000)
    expect(craftsmanPayout?.amount).toBe(225_000)
  })

  it('отклоняется, если возврат больше возможного при уже сделанных выплатах', () => {
    const deal = disputedFrom('awaiting_acceptance')
    expect(() =>
      resolveDispute(
        deal,
        { kind: 'partial_refund', refundAmount: 800_000, itemFate: 'stays_with_client', removalCostBearer: 'craftsman' },
        paidOutFor(deal),
      ),
    ).toThrow(/полн/i)
  })

  it('нулевая сумма возврата отклоняется: система её не вычисляет за арбитра', () => {
    const deal = disputedFrom('awaiting_acceptance')
    expect(() =>
      resolveDispute(
        deal,
        { kind: 'partial_refund', refundAmount: 0, itemFate: 'stays_with_client', removalCostBearer: 'craftsman' },
        paidOutFor(deal),
      ),
    ).toThrow(/сумм/i)
  })

  it('остаток ноль не порождает выплату мебельщику', () => {
    const deal = disputedFrom('awaiting_acceptance')
    const { craftsmanPayout } = resolveDispute(
      deal,
      { kind: 'partial_refund', refundAmount: 525_000, itemFate: 'stays_with_client', removalCostBearer: 'craftsman' },
      paidOutFor(deal),
    )
    expect(craftsmanPayout).toBeNull()
  })
})

describe('resolveDispute: полный возврат', () => {
  it('возвращает всю сумму сделки, а не остаток удержания', () => {
    const deal = disputedFrom('awaiting_acceptance')
    const { deal: resolved } = resolveDispute(
      deal,
      { kind: 'full_refund', itemFate: 'returns_to_craftsman', removalCostBearer: 'craftsman' },
      paidOutFor(deal),
    )

    expect(resolved.refundAmount).toBe(1_000_000)
    expect(resolved.status).toBe('cancelled_refunded')
  })

  it('разница сверх выплаченного покрывается резервом платформы и учитывается отдельно', () => {
    const deal = disputedFrom('awaiting_acceptance')
    const { reservePayout } = resolveDispute(
      deal,
      { kind: 'full_refund', itemFate: 'returns_to_craftsman', removalCostBearer: 'craftsman' },
      paidOutFor(deal),
    )
    // Клиенту возвращается миллион, тогда как на счету осталось 525 000 после выплаты аванса.
    expect(reservePayout).toBe(475_000)
  })
})

describe('resolveDispute: устранение недостатков', () => {
  it('переводит сделку в «Устранение» и фиксирует срок', () => {
    const deal = disputedFrom('awaiting_acceptance')
    const { deal: resolved } = resolveDispute(deal, {
      kind: 'remedy',
      remedyDeadline: '2026-09-01',
    })

    expect(resolved.status).toBe('remedy')
    expect(resolved.remedyDeadline).toBe('2026-09-01')
  })

  it('без срока решение не сохраняется: состояние без выхода', () => {
    const deal = disputedFrom('awaiting_acceptance')
    expect(() => resolveDispute(deal, { kind: 'remedy', remedyDeadline: '' })).toThrow(/срок/i)
  })

  it('недоступно, если спор открыт из производства', () => {
    const deal = disputedFrom('in_production')
    expect(() => resolveDispute(deal, { kind: 'remedy', remedyDeadline: '2026-09-01' })).toThrow(
      /окн[аеи] приёмки/i,
    )
  })
})
