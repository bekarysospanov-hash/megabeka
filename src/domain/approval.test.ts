import { describe, expect, it } from 'vitest'
import {
  approveDeal,
  clientAccepts,
  createDeal,
  onboardClient,
  rejectApproval,
  requireApproval,
  sendToClient,
  updateDealSpec,
} from './dealMachine'
import { DEAL_AMOUNT_LIMIT } from './dealLimits'
import type { CreateDealInput, Deal } from './types'

const withinLimit: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур',
  amount: 800_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 5,
}

const overLimit: CreateDealInput = { ...withinLimit, amount: DEAL_AMOUNT_LIMIT + 500_000 }

function draft(input: CreateDealInput): Deal {
  return createDeal(input)
}

describe('sendToClient и лимит суммы (FR-06, FR-36, FR-44)', () => {
  it('сделка в пределах лимита уходит клиенту напрямую', () => {
    expect(sendToClient(draft(withinLimit)).status).toBe('awaiting_client')
  })

  it('сделка сверх лимита уходит на одобрение оператора, а не клиенту', () => {
    expect(sendToClient(draft(overLimit)).status).toBe('pending_approval')
  })

  it('сумма ровно на лимите одобрения не требует', () => {
    const deal = draft({ ...withinLimit, amount: DEAL_AMOUNT_LIMIT })
    expect(sendToClient(deal).status).toBe('awaiting_client')
  })
})

describe('approveDeal (FR-44)', () => {
  it('одобрение отправляет сделку клиенту', () => {
    const pending = sendToClient(draft(overLimit))
    expect(approveDeal(pending).status).toBe('awaiting_client')
  })

  it('одобрять можно только сделку, ожидающую одобрения', () => {
    expect(() => approveDeal(draft(overLimit))).toThrow()
  })

  it('сделка, пришедшая на одобрение из согласования, возвращается в согласование', () => {
    let deal = onboardClient(sendToClient(draft(withinLimit)), 'Айгерим', '+77011110000')
    // Правка в торге подняла сумму выше лимита (FR-52)
    deal = updateDealSpec(deal, { ...withinLimit, amount: DEAL_AMOUNT_LIMIT + 100_000 })
    const pending = requireApproval(deal)

    expect(approveDeal(pending).status).toBe('negotiation')
  })
})

describe('rejectApproval (FR-44)', () => {
  it('отклонение возвращает сделку в черновик и хранит причину', () => {
    const pending = sendToClient(draft(overLimit))
    const rejected = rejectApproval(pending, 'сумма выше согласованного потолка')

    expect(rejected.status).toBe('draft')
    expect(rejected.approvalRejectReason).toBe('сумма выше согласованного потолка')
  })

  it('отклонение без комментария не сохраняется', () => {
    const pending = sendToClient(draft(overLimit))
    expect(() => rejectApproval(pending, '  ')).toThrow(/комментар|причин/i)
  })

  it('сделка из согласования возвращается в согласование, а не в черновик', () => {
    let deal = onboardClient(sendToClient(draft(withinLimit)), 'Айгерим', '+77011110000')
    deal = clientAccepts(deal)
    const pending = requireApproval(deal)

    expect(rejectApproval(pending, 'слишком крупная').status).toBe('negotiation')
  })
})

describe('requireApproval (FR-52)', () => {
  it('переводит сделку из согласования на одобрение', () => {
    const deal = onboardClient(sendToClient(draft(withinLimit)), 'Айгерим', '+77011110000')
    expect(requireApproval(deal).status).toBe('pending_approval')
  })

  it('сбрасывает согласие клиента: условия изменились', () => {
    const accepted = clientAccepts(onboardClient(sendToClient(draft(withinLimit)), 'А', '+7701'))
    expect(requireApproval(accepted).clientAccepted).toBe(false)
  })
})
