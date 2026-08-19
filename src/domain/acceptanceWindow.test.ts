import { describe, expect, it } from 'vitest'
import {
  ACCEPTANCE_WINDOW_WORKING_DAYS,
  addWorkingDays,
  calculateAcceptanceDeadline,
  isWorkingDay,
} from './acceptanceWindow'

describe('isWorkingDay', () => {
  it('будний день — рабочий', () => {
    // среда, 19 августа 2026
    expect(isWorkingDay(new Date(2026, 7, 19))).toBe(true)
  })

  it('суббота и воскресенье — нерабочие', () => {
    expect(isWorkingDay(new Date(2026, 7, 22))).toBe(false)
    expect(isWorkingDay(new Date(2026, 7, 23))).toBe(false)
  })

  it('государственный праздник РК — нерабочий, даже если будний', () => {
    // 30 августа 2026 — День Конституции, воскресенье; берём будний праздник:
    // 1 мая 2026 — пятница, День единства народа Казахстана
    expect(isWorkingDay(new Date(2026, 4, 1))).toBe(false)
  })

  it('Наурыз — три подряд нерабочих дня', () => {
    expect(isWorkingDay(new Date(2026, 2, 21))).toBe(false)
    expect(isWorkingDay(new Date(2026, 2, 22))).toBe(false)
    expect(isWorkingDay(new Date(2026, 2, 23))).toBe(false)
  })
})

describe('addWorkingDays', () => {
  it('со среды три рабочих дня дают понедельник: выходные не считаются', () => {
    const result = addWorkingDays(new Date(2026, 7, 19), 3)
    expect(result.getDate()).toBe(24)
    expect(result.getDay()).toBe(1)
  })

  it('с пятницы три рабочих дня дают среду', () => {
    const result = addWorkingDays(new Date(2026, 7, 21), 3)
    expect(result.getDate()).toBe(26)
  })

  it('праздник внутри окна сдвигает срок', () => {
    // со вторника 28 апреля 2026: ср 29, чт 30 рабочие, пт 1 мая — праздник,
    // значит третий рабочий день — понедельник 4 мая
    const result = addWorkingDays(new Date(2026, 3, 28), 3)
    expect(result.getMonth()).toBe(4)
    expect(result.getDate()).toBe(4)
  })

  it('ноль рабочих дней оставляет дату на месте', () => {
    const start = new Date(2026, 7, 19)
    expect(addWorkingDays(start, 0).getTime()).toBe(start.getTime())
  })
})

describe('calculateAcceptanceDeadline (FR-20)', () => {
  it('окно приёмки — 3 рабочих дня', () => {
    expect(ACCEPTANCE_WINDOW_WORKING_DAYS).toBe(3)
  })

  it('считает срок от момента заявления готовности', () => {
    const declaredAt = new Date(2026, 7, 19, 14, 30).toISOString()
    const deadline = new Date(calculateAcceptanceDeadline(declaredAt))
    expect(deadline.getDate()).toBe(24)
  })

  it('сохраняет время суток заявления готовности', () => {
    const declaredAt = new Date(2026, 7, 19, 18, 40).toISOString()
    const deadline = new Date(calculateAcceptanceDeadline(declaredAt))
    expect(deadline.getHours()).toBe(18)
    expect(deadline.getMinutes()).toBe(40)
  })

  it('готовность в пятницу вечером: отсчёт не съедает выходные', () => {
    const declaredAt = new Date(2026, 7, 21, 19, 0).toISOString()
    const deadline = new Date(calculateAcceptanceDeadline(declaredAt))
    expect(deadline.getDate()).toBe(26)
  })
})
