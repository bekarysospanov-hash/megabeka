import { describe, expect, it } from 'vitest'
import { formatDate, formatDocumentDate, formatMoney } from './statusLabels'

const thisYear = new Date().getFullYear()
const lastYear = thisYear - 1

describe('formatMoney', () => {
  it('ставит знак тенге после суммы, а не код валюты', () => {
    const result = formatMoney(1_840_000)
    expect(result).toContain('₸')
    expect(result).not.toContain('KZT')
  })

  it('отделяет знак тенге неразрывным пробелом, чтобы сумма не рвалась переносом', () => {
    expect(formatMoney(1_840_000)).toMatch(/ ₸$/)
  })

  it('не показывает дробную часть', () => {
    expect(formatMoney(1_840_000.4)).not.toContain(',')
  })
})

describe('formatDate (интерфейс)', () => {
  it('в текущем году год не показывает — дизайн-спека, раздел 7', () => {
    const result = formatDate(new Date(thisYear, 7, 16).toISOString())
    expect(result).toContain('августа')
    expect(result).not.toContain(String(thisYear))
  })

  it('в прошлом году год показывает', () => {
    const result = formatDate(new Date(lastYear, 7, 16).toISOString())
    expect(result).toContain(String(lastYear))
  })
})

describe('formatDocumentDate (договор, акт)', () => {
  it('всегда несёт год, даже в текущем году', () => {
    const result = formatDocumentDate(new Date(thisYear, 7, 16).toISOString())
    expect(result).toContain(String(thisYear))
  })

  it('отличается от интерфейсного формата именно годом', () => {
    const iso = new Date(thisYear, 7, 16).toISOString()
    expect(formatDocumentDate(iso)).not.toBe(formatDate(iso))
  })
})
