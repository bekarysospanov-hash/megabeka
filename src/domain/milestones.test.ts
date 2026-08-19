import { describe, expect, it } from 'vitest'
import {
  buildMilestones,
  confirmMilestone,
  declareMilestone,
  rejectMilestone,
  milestoneAmount,
  nextClaimableMilestone,
} from './milestones'
import { createDeal } from './dealMachine'
import type { CreateDealInput, Deal, Milestone } from './types'

const twoPart: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур',
  amount: 1_000_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 5,
}

const threePart: CreateDealInput = { ...twoPart, prepaymentPercent: 30, interimPercent: 20, finalPercent: 50 }

function dealWith(input: CreateDealInput): Deal {
  return createDeal(input)
}

describe('buildMilestones (FR-03)', () => {
  it('двухчастная схема даёт два этапа, последний — приёмка', () => {
    const ms = buildMilestones(dealWith(twoPart))
    expect(ms).toHaveLength(2)
    expect(ms[1].isFinal).toBe(true)
    expect(ms[1].title).toContain('риёмка')
  })

  it('трёхчастная схема даёт три этапа по порядку', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(ms.map((m) => m.sharePercent)).toEqual([30, 20, 50])
    expect(ms.map((m) => m.orderNo)).toEqual([1, 2, 3])
  })

  it('ровно один финальный этап на сделку', () => {
    expect(buildMilestones(dealWith(threePart)).filter((m) => m.isFinal)).toHaveLength(1)
  })

  it('все этапы начинаются запланированными', () => {
    expect(buildMilestones(dealWith(threePart)).every((m) => m.status === 'planned')).toBe(true)
  })

  it('доли этапов в сумме дают 100%', () => {
    const total = buildMilestones(dealWith(threePart)).reduce((s, m) => s + m.sharePercent, 0)
    expect(total).toBe(100)
  })
})

describe('milestoneAmount', () => {
  it('сумма этапа считается за вычетом комиссии — столько получит мебельщик', () => {
    const deal = dealWith(twoPart)
    const [first] = buildMilestones(deal)
    expect(milestoneAmount(deal, first)).toBe(475_000)
  })
})

describe('nextClaimableMilestone (FR-13)', () => {
  it('первым заявляется этап с наименьшим номером', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(nextClaimableMilestone(ms)?.orderNo).toBe(1)
  })

  it('следующий этап доступен только после подтверждения предыдущего', () => {
    const ms = buildMilestones(dealWith(threePart))
    const declared = declareMilestone(ms, 1, ['photo.jpg'])
    expect(nextClaimableMilestone(declared)).toBeNull()

    const confirmed = confirmMilestone(declared, 1)
    expect(nextClaimableMilestone(confirmed)?.orderNo).toBe(2)
  })

  it('финальный этап мебельщиком не заявляется — его закрывает приёмка', () => {
    const ms = buildMilestones(dealWith(twoPart))
    const confirmed = confirmMilestone(declareMilestone(ms, 1, ['p.jpg']), 1)
    expect(nextClaimableMilestone(confirmed)).toBeNull()
  })
})

describe('declareMilestone (FR-13)', () => {
  it('заявление без фотографий отклоняется: арбитражу нечего сверять', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(() => declareMilestone(ms, 1, [])).toThrow(/фото/i)
  })

  it('нельзя заявить этап через порядок', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(() => declareMilestone(ms, 2, ['p.jpg'])).toThrow(/порядк/i)
  })

  it('нельзя заявить уже заявленный этап повторно', () => {
    const declared = declareMilestone(buildMilestones(dealWith(threePart)), 1, ['p.jpg'])
    expect(() => declareMilestone(declared, 1, ['p.jpg'])).toThrow()
  })
})

describe('confirmMilestone и rejectMilestone (FR-14)', () => {
  it('подтверждение переводит этап в confirmed', () => {
    const declared = declareMilestone(buildMilestones(dealWith(threePart)), 1, ['p.jpg'])
    expect(confirmMilestone(declared, 1)[0].status).toBe('confirmed')
  })

  it('отклонение возвращает этап в planned и хранит причину', () => {
    const declared = declareMilestone(buildMilestones(dealWith(threePart)), 1, ['p.jpg'])
    const rejected = rejectMilestone(declared, 1, 'на фото не видно кромки')

    expect(rejected[0].status).toBe('planned')
    expect(rejected[0].rejectReason).toBe('на фото не видно кромки')
  })

  it('отклонение без комментария не сохраняется', () => {
    const declared = declareMilestone(buildMilestones(dealWith(threePart)), 1, ['p.jpg'])
    expect(() => rejectMilestone(declared, 1, '   ')).toThrow(/причин|комментар/i)
  })

  it('подтвердить можно только заявленный этап', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(() => confirmMilestone(ms, 1)).toThrow()
  })

  it('повторное заявление после отклонения разрешено', () => {
    const declared = declareMilestone(buildMilestones(dealWith(threePart)), 1, ['p.jpg'])
    const rejected = rejectMilestone(declared, 1, 'переснимите')
    expect(declareMilestone(rejected, 1, ['better.jpg'])[0].status).toBe('declared')
  })
})

describe('финальный этап (7.4)', () => {
  it('закрывается приёмкой, а не заявлением мебельщика', () => {
    const ms: Milestone[] = buildMilestones(dealWith(twoPart))
    const final = ms.find((m) => m.isFinal)!
    expect(() => declareMilestone(ms, final.orderNo, ['p.jpg'])).toThrow(/приёмк/i)
  })
})
