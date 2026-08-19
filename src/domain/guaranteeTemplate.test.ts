import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import { generateGuaranteeText } from './guaranteeTemplate'
import { formatMoney } from './statusLabels'
import type { CreateDealInput } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур на заказ',
  amount: 1_000_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 10,
}

describe('generateGuaranteeText', () => {
  it('содержит сумму сделки и название заказа', () => {
    const deal = createDeal(baseInput)
    const text = generateGuaranteeText(deal)
    expect(text).toContain(formatMoney(deal.amount))
    expect(text).toContain(deal.title)
  })

  it('содержит условие 100% оплаты после подписания акта', () => {
    const deal = createDeal(baseInput)
    const text = generateGuaranteeText(deal)
    expect(text).toContain('100%')
    expect(text.toLowerCase()).toContain('акт')
  })

  it('при двухчастной схеме не упоминает промежуточный транш', () => {
    const deal = createDeal(baseInput)
    const text = generateGuaranteeText(deal)
    expect(text).not.toContain('промежуточный транш')
  })

  it('при трёхчастной схеме описывает все три транша', () => {
    const deal = createDeal({ ...baseInput, prepaymentPercent: 30, interimPercent: 20, finalPercent: 50 })
    const text = generateGuaranteeText(deal)
    expect(text).toContain('предоплата 30%')
    expect(text).toContain('промежуточный транш 20%')
    expect(text).toContain('окончательный платёж 50%')
  })

  it('не утверждает фиксированное число траншей словом', () => {
    const deal = createDeal({ ...baseInput, prepaymentPercent: 30, interimPercent: 20, finalPercent: 50 })
    expect(generateGuaranteeText(deal)).not.toContain('двумя траншами')
  })

  it('называет потолок выплат до приёмки (FR-04)', () => {
    const text = generateGuaranteeText(createDeal(baseInput))
    expect(text).toContain('не более 50%')
  })
})
