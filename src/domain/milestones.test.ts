import { describe, expect, it } from 'vitest'
import {
  buildMilestones,
  canTakeMilestoneAdvance,
  firstUntakenMilestone,
  milestoneAmount,
  nextClaimableMilestone,
  takeMilestoneAdvance,
} from './milestones'
import { createDeal } from './dealMachine'
import type { CreateDealInput, Deal } from './types'

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

describe('nextClaimableMilestone', () => {
  it('первым берётся этап с наименьшим номером', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(nextClaimableMilestone(ms)?.orderNo).toBe(1)
  })

  it('следующий этап доступен только после того, как взят предыдущий', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(nextClaimableMilestone(takeMilestoneAdvance(ms, 1, 'in_production', false))?.orderNo).toBe(2)
  })

  it('финальный этап мебельщиком не берётся — его закрывает приёмка', () => {
    const ms = buildMilestones(dealWith(twoPart))
    expect(nextClaimableMilestone(takeMilestoneAdvance(ms, 1, 'in_production', false))).toBeNull()
  })
})

describe('takeMilestoneAdvance — транш под этап', () => {
  // Модель пилота: мебельщик ведёт сделку сам, оператор контролирует не работу, а движение
  // денег — вывод транша он подтверждает в очереди запросов. Поэтому фото и подтверждение
  // этапа из модели убраны: транш нужен ДО закупа материалов, а не после него.
  it('переводит нефинальный этап в confirmed и ставит время', () => {
    const [first] = takeMilestoneAdvance(buildMilestones(dealWith(threePart)), 1, 'in_production', false)
    expect(first.status).toBe('confirmed')
    expect(first.confirmedAt).not.toBeNull()
  })

  // Повторное взятие раскрыло бы долю второй раз — то есть выдало бы одни деньги дважды.
  it('повторное взятие того же этапа отклоняется', () => {
    const taken = takeMilestoneAdvance(buildMilestones(dealWith(threePart)), 1, 'in_production', false)
    expect(() => takeMilestoneAdvance(taken, 1, 'in_production', false)).toThrow(/взят|уже/i)
  })

  it('нельзя взять транш через порядок', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(() => takeMilestoneAdvance(ms, 2, 'in_production', false)).toThrow(/порядк/i)
  })

  it('финальный этап взять нельзя: его закрывает приёмка', () => {
    const ms = buildMilestones(dealWith(twoPart))
    const final = ms.find((m) => m.isFinal)!
    expect(() => takeMilestoneAdvance(ms, final.orderNo, 'in_production', false)).toThrow(/приёмк/i)
  })

  it('не задевает остальные этапы', () => {
    const ms = buildMilestones(dealWith(threePart))
    const taken = takeMilestoneAdvance(ms, 1, 'in_production', false)
    expect(taken.slice(1)).toEqual(ms.slice(1))
  })
})

describe('takeMilestoneAdvance — гейты по состоянию сделки', () => {
  // Спор означает «изделия нет или оно негодное». Раньше путь был закрыт устройством процесса:
  // раскрыть транш мог только оператор, и во время спора он бы этого не сделал. Теперь долю
  // раскрывает сам мебельщик, поэтому запрет обязан жить в домене.
  it('в открытом споре транш взять нельзя', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(() => takeMilestoneAdvance(ms, 1, 'dispute_open', false)).toThrow(/спор/i)
  })

  it('на замороженной сделке транш взять нельзя', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(() => takeMilestoneAdvance(ms, 1, 'in_production', true)).toThrow(/заморож/i)
  })

  // Деньги по такой сделке уже вернули клиенту: раскрытие создало бы транзакцию и уведомление
  // о выплате по сделке, где выплачивать нечего.
  it('на закрытой возвратом сделке транш взять нельзя', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(() => takeMilestoneAdvance(ms, 1, 'cancelled_refunded', false)).toThrow(/возврат|закрыт/i)
  })

  it('на завершённой сделке транш взять нельзя', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(() => takeMilestoneAdvance(ms, 1, 'completed', false)).toThrow(/завершен|завершён|закрыт/i)
  })

  it('разрешено на статусах, где работа идёт или сдаётся', () => {
    const ms = buildMilestones(dealWith(threePart))
    for (const status of ['in_production', 'remedy', 'awaiting_acceptance', 'act_signing'] as const) {
      expect(takeMilestoneAdvance(ms, 1, status, false)[0].status).toBe('confirmed')
    }
  })

  it('canTakeMilestoneAdvance отвечает тем же правилом, что и сам переход', () => {
    expect(canTakeMilestoneAdvance('in_production', false)).toBe(true)
    expect(canTakeMilestoneAdvance('in_production', true)).toBe(false)
    expect(canTakeMilestoneAdvance('dispute_open', false)).toBe(false)
    expect(canTakeMilestoneAdvance('cancelled_refunded', false)).toBe(false)
  })
})

describe('firstUntakenMilestone (FR-19)', () => {
  // FR-19: заявить готовность нельзя, пока есть невзятый этап. Иначе сделка дойдёт до
  // «Завершена» с невзятой долей, и деньги мебельщика останутся на платформе.
  it('возвращает первый невзятый нефинальный этап', () => {
    const ms = buildMilestones(dealWith(threePart))
    expect(firstUntakenMilestone(ms)?.orderNo).toBe(1)
    expect(firstUntakenMilestone(takeMilestoneAdvance(ms, 1, 'in_production', false))?.orderNo).toBe(2)
  })

  it('возвращает null, когда все нефинальные этапы взяты', () => {
    let ms = buildMilestones(dealWith(threePart))
    ms = takeMilestoneAdvance(ms, 1, 'in_production', false)
    ms = takeMilestoneAdvance(ms, 2, 'in_production', false)
    expect(firstUntakenMilestone(ms)).toBeNull()
  })

  it('финальный этап невзятым не считается: его закрывает приёмка', () => {
    const ms = takeMilestoneAdvance(buildMilestones(dealWith(twoPart)), 1, 'in_production', false)
    expect(firstUntakenMilestone(ms)).toBeNull()
  })
})
