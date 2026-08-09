import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import { PROGRESS_STAGES, getProgressStageIndex, groupDealsByStage } from './progressStages'
import { STATUS_LABELS } from './statusLabels'
import type { CreateDealInput, Deal, DealStatus } from './types'

const ALL_STATUSES = Object.keys(STATUS_LABELS) as DealStatus[]
const OFF_TRACK_STATUSES: DealStatus[] = ['dispute_open', 'cancelled_refunded']
const NORMAL_STATUSES = ALL_STATUSES.filter((s) => !OFF_TRACK_STATUSES.includes(s))

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Шкаф-купе',
  amount: 500_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 10,
}

function dealWith(status: DealStatus): Deal {
  return { ...createDeal(baseInput), status }
}

describe('PROGRESS_STAGES', () => {
  it('содержит 6 укрупнённых стадий', () => {
    expect(PROGRESS_STAGES).toHaveLength(6)
  })

  it('каждая стадия имеет непустой label', () => {
    for (const stage of PROGRESS_STAGES) {
      expect(stage.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('каждый обычный статус входит ровно в одну стадию', () => {
    for (const status of NORMAL_STATUSES) {
      const stagesContaining = PROGRESS_STAGES.filter((stage) => stage.statuses.includes(status))
      expect(stagesContaining, `status ${status}`).toHaveLength(1)
    }
  })

  it('dispute_open и cancelled_refunded не входят ни в одну стадию', () => {
    for (const status of OFF_TRACK_STATUSES) {
      const stagesContaining = PROGRESS_STAGES.filter((stage) => stage.statuses.includes(status))
      expect(stagesContaining, `status ${status}`).toHaveLength(0)
    }
  })
})

describe('getProgressStageIndex', () => {
  it('draft возвращает индекс 0', () => {
    expect(getProgressStageIndex('draft')).toBe(0)
  })

  it('completed возвращает последний индекс', () => {
    expect(getProgressStageIndex('completed')).toBe(PROGRESS_STAGES.length - 1)
  })

  it('dispute_open возвращает null', () => {
    expect(getProgressStageIndex('dispute_open')).toBeNull()
  })

  it('cancelled_refunded возвращает null', () => {
    expect(getProgressStageIndex('cancelled_refunded')).toBeNull()
  })

  it('индексы монотонно возрастают по счастливому пути', () => {
    const draft = getProgressStageIndex('draft')!
    const contractSigning = getProgressStageIndex('contract_signing')!
    const paymentPending = getProgressStageIndex('payment_pending')!
    const inProduction = getProgressStageIndex('in_production')!
    const awaitingAcceptance = getProgressStageIndex('awaiting_acceptance')!
    const completed = getProgressStageIndex('completed')!

    expect(draft).toBeLessThan(contractSigning)
    expect(contractSigning).toBeLessThan(paymentPending)
    expect(paymentPending).toBeLessThan(inProduction)
    expect(inProduction).toBeLessThan(awaitingAcceptance)
    expect(awaitingAcceptance).toBeLessThan(completed)
  })
})

describe('groupDealsByStage', () => {
  it('пустой список сделок — все 6 стадий присутствуют с пустыми списками', () => {
    const groups = groupDealsByStage([])
    expect(groups).toHaveLength(PROGRESS_STAGES.length)
    for (const group of groups) {
      expect(group.deals).toEqual([])
    }
  })

  it('сделка попадает в стадию, соответствующую её статусу', () => {
    const deal = dealWith('in_production')
    const groups = groupDealsByStage([deal])
    const productionGroup = groups.find((g) => g.stage.key === 'production')!
    expect(productionGroup.deals).toEqual([deal])
  })

  it('несколько сделок на разных статусах одной стадии — все попадают в неё', () => {
    const dealA = dealWith('payment_pending')
    const dealB = dealWith('paid')
    const groups = groupDealsByStage([dealA, dealB])
    const paymentGroup = groups.find((g) => g.stage.key === 'payment')!
    expect(paymentGroup.deals).toEqual([dealA, dealB])
  })

  it('сделки в dispute_open/cancelled_refunded не входят ни в одну стадию', () => {
    const disputed = dealWith('dispute_open')
    const cancelled = dealWith('cancelled_refunded')
    const groups = groupDealsByStage([disputed, cancelled])
    for (const group of groups) {
      expect(group.deals).not.toContain(disputed)
      expect(group.deals).not.toContain(cancelled)
    }
  })
})
