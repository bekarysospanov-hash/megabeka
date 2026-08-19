import { describe, expect, it } from 'vitest'
import {
  DEAL_AMOUNT_LIMIT,
  PRE_ACCEPTANCE_SHARE_CAP,
  exceedsDealAmountLimit,
  preAcceptanceShare,
  validatePaymentSplit,
} from './dealLimits'

describe('preAcceptanceShare', () => {
  it('складывает предоплату и промежуточный транш', () => {
    expect(preAcceptanceShare(30, 20)).toBe(50)
  })

  it('без промежуточного транша равна предоплате', () => {
    expect(preAcceptanceShare(50, 0)).toBe(50)
  })
})

describe('validatePaymentSplit (FR-03, FR-04)', () => {
  it('принимает схему 50 / 50 — до приёмки ровно потолок', () => {
    expect(validatePaymentSplit(50, 0, 50)).toEqual({ valid: true })
  })

  it('принимает схему 30 / 20 / 50', () => {
    expect(validatePaymentSplit(30, 20, 50)).toEqual({ valid: true })
  })

  it('отклоняет схему, где до приёмки больше 50%, и называет действующий потолок', () => {
    const result = validatePaymentSplit(30, 30, 40)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('60')
    expect(result.error).toContain(String(PRE_ACCEPTANCE_SHARE_CAP))
  })

  it('отклоняет схему, где сумма долей не равна 100, и показывает фактическую сумму', () => {
    const result = validatePaymentSplit(30, 20, 40)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('90')
  })

  it('отклоняет нулевую долю финального этапа: после приёмки нечем удерживать исполнителя', () => {
    const result = validatePaymentSplit(30, 20, 0)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('финальн')
  })

  it('нарушение потолка проверяется раньше суммы долей — оно конкретнее для пользователя', () => {
    const result = validatePaymentSplit(60, 30, 10)
    expect(result.error).toContain(String(PRE_ACCEPTANCE_SHARE_CAP))
  })
})

describe('exceedsDealAmountLimit (FR-36)', () => {
  it('сумма ровно на лимите не считается превышением', () => {
    expect(exceedsDealAmountLimit(DEAL_AMOUNT_LIMIT)).toBe(false)
  })

  it('сумма выше лимита требует одобрения оператора', () => {
    expect(exceedsDealAmountLimit(DEAL_AMOUNT_LIMIT + 1)).toBe(true)
  })

  it('лимит одной сделки — 2 млн ₸ (решение PM)', () => {
    expect(DEAL_AMOUNT_LIMIT).toBe(2_000_000)
  })
})
