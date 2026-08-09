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
})
