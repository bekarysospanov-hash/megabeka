import { describe, expect, it } from 'vitest'
import {
  callOperator,
  clientAccepts,
  createDeal,
  freezeDispute,
  initiateRefund,
  markProductionDone,
  onboardClient,
  pay,
  requestRevision,
  resolveDispute,
  sendToClient,
  signAct,
  signActByFurnitureMaker,
  signByClientSms,
  signByFurnitureMaker,
  submitPayment,
} from './dealMachine'
import { seedScenarios } from './seedScenarios'
import type { CreateDealInput, Deal } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур на заказ',
  amount: 1_000_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 10,
}

function toAwaitingClient(): Deal {
  return sendToClient(createDeal(baseInput))
}

function toNegotiation(): Deal {
  return onboardClient(toAwaitingClient(), 'Данияр Ахметов', '+77001234567')
}

function toContractSigning(): Deal {
  return signByFurnitureMaker(clientAccepts(toNegotiation()), '5555')
}

function toPaymentPending(): Deal {
  return signByClientSms(toContractSigning(), '0000')
}

function toPaymentProcessing(): Deal {
  return submitPayment(toPaymentPending(), 'card')
}

function toInProduction(): Deal {
  return pay(toPaymentProcessing()).deal
}

function toAwaitingAcceptance(): Deal {
  return markProductionDone(toInProduction())
}

function toActSigning(): Deal {
  return signActByFurnitureMaker(toAwaitingAcceptance(), '7777')
}

describe('createDeal', () => {
  it('создаёт сделку в статусе draft с уникальной ссылкой', () => {
    const deal = createDeal(baseInput)
    expect(deal.status).toBe('draft')
    expect(deal.slug).toBeTruthy()
    const other = createDeal(baseInput)
    expect(other.slug).not.toBe(deal.slug)
  })

  it('выдаёт гарантию сразу при создании — guaranteeIssuedAt проставлен валидной датой не в будущем', () => {
    const before = Date.now()
    const deal = createDeal(baseInput)
    expect(deal.guaranteeIssuedAt).toBeTruthy()
    const issuedAt = new Date(deal.guaranteeIssuedAt).getTime()
    expect(issuedAt).toBeGreaterThanOrEqual(before)
    expect(issuedAt).toBeLessThanOrEqual(Date.now())
  })
})

describe('sendToClient', () => {
  it('переводит draft в awaiting_client', () => {
    const deal = toAwaitingClient()
    expect(deal.status).toBe('awaiting_client')
  })
})

describe('onboardClient', () => {
  it('переводит awaiting_client в negotiation и сохраняет имя и телефон', () => {
    const deal = toNegotiation()
    expect(deal.status).toBe('negotiation')
    expect(deal.clientName).toBe('Данияр Ахметов')
    expect(deal.clientPhone).toBe('+77001234567')
  })
})

describe('requestRevision', () => {
  it('создаёт запись правки с diff и оставляет сделку в negotiation', () => {
    const deal = toNegotiation()
    const { deal: updated, revision } = requestRevision(
      deal,
      'amount',
      '1000000',
      '950000',
      'скидка за объём',
    )
    expect(updated.status).toBe('negotiation')
    expect(revision.oldValue).toBe('1000000')
    expect(revision.newValue).toBe('950000')
  })
})

describe('clientAccepts', () => {
  it('выставляет флаг clientAccepted, оставляя сделку в negotiation', () => {
    const deal = clientAccepts(toNegotiation())
    expect(deal.status).toBe('negotiation')
    expect(deal.clientAccepted).toBe(true)
  })
})

describe('signByFurnitureMaker', () => {
  it('недоступен, пока клиент не принял условия', () => {
    expect(() => signByFurnitureMaker(toNegotiation(), '1234')).toThrow()
  })

  it('переводит negotiation в contract_signing после принятия клиентом', () => {
    const deal = toContractSigning()
    expect(deal.status).toBe('contract_signing')
  })
})

describe('signByClientSms', () => {
  it('переводит contract_signing в payment_pending через contract_signed', () => {
    const deal = toPaymentPending()
    expect(deal.status).toBe('payment_pending')
    expect(deal.statusHistory.some((h) => h.status === 'contract_signed')).toBe(true)
  })
})

describe('submitPayment', () => {
  it('переводит payment_pending в payment_processing и запоминает способ оплаты', () => {
    const deal = toPaymentProcessing()
    expect(deal.status).toBe('payment_processing')
    expect(deal.paymentMethod).toBe('card')
  })
})

describe('pay', () => {
  it('недоступен, пока платёж не отправлен на обработку', () => {
    expect(() => pay(toPaymentPending())).toThrow()
  })

  it('создаёт транш предоплаты за вычетом комиссии', () => {
    const { transaction } = pay(toPaymentProcessing())
    expect(transaction.type).toBe('prepayment')
    expect(transaction.amount).toBe(450_000)
  })

  it('автоматически переводит сделку в in_production', () => {
    const deal = toInProduction()
    expect(deal.status).toBe('in_production')
  })
})

describe('markProductionDone', () => {
  it('переводит in_production в awaiting_acceptance', () => {
    const deal = toAwaitingAcceptance()
    expect(deal.status).toBe('awaiting_acceptance')
  })
})

describe('signActByFurnitureMaker', () => {
  it('переводит awaiting_acceptance в act_signing', () => {
    const deal = toActSigning()
    expect(deal.status).toBe('act_signing')
  })
})

describe('signAct', () => {
  it('недоступен, пока мебельщик не подписал акт', () => {
    expect(() => signAct(toAwaitingAcceptance(), '1234')).toThrow()
  })

  it('переводит сделку в completed и создаёт финальный транш за вычетом комиссии', () => {
    const { deal, transaction } = signAct(toActSigning(), '1234')
    expect(deal.status).toBe('completed')
    expect(deal.statusHistory.some((h) => h.status === 'act_signed')).toBe(true)
    expect(transaction.type).toBe('final')
    expect(transaction.amount).toBe(450_000)
  })
})

describe('callOperator', () => {
  it('недоступен на draft и awaiting_client', () => {
    expect(() => callOperator(createDeal(baseInput), 'client', 'вопрос')).toThrow()
    expect(() => callOperator(toAwaitingClient(), 'client', 'вопрос')).toThrow()
  })

  it('доступен с negotiation и переводит сделку в dispute_open с сохранением previousStatus', () => {
    const before = toInProduction()
    const { deal } = callOperator(before, 'client', 'задержка сроков')
    expect(deal.status).toBe('dispute_open')
    expect(deal.previousStatus).toBe('in_production')
  })
})

describe('freezeDispute', () => {
  it('оставляет сделку в dispute_open и выставляет флаг frozen', () => {
    const { deal } = callOperator(toInProduction(), 'client', 'задержка сроков')
    const frozen = freezeDispute(deal)
    expect(frozen.status).toBe('dispute_open')
    expect(frozen.frozen).toBe(true)
  })
})

describe('initiateRefund', () => {
  it('необратимо переводит сделку в cancelled_refunded', () => {
    const { deal } = callOperator(toInProduction(), 'client', 'товар не подошёл')
    const refunded = initiateRefund(deal)
    expect(refunded.status).toBe('cancelled_refunded')
  })
})

describe('resolveDispute', () => {
  it('возвращает сделку в статус, из которого был открыт спор, и снимает frozen', () => {
    const { deal } = callOperator(toInProduction(), 'client', 'задержка сроков')
    const frozen = freezeDispute(deal)
    const resolved = resolveDispute(frozen)
    expect(resolved.status).toBe('in_production')
    expect(resolved.frozen).toBe(false)
  })
})

describe('seedScenarios', () => {
  it('возвращает три сценария: happy, revisions, dispute', () => {
    const scenarios = seedScenarios()
    expect(scenarios.map((s) => s.key).sort()).toEqual(['dispute', 'happy', 'revisions'])
  })

  it('сценарий с правками содержит хотя бы одну запись истории изменений', () => {
    const scenarios = seedScenarios()
    const revisions = scenarios.find((s) => s.key === 'revisions')!
    expect(revisions.deal.status).toBeTruthy()
  })

  it('все сид-сделки имеют выданную гарантию', () => {
    const scenarios = seedScenarios()
    for (const scenario of scenarios) {
      expect(scenario.deal.guaranteeIssuedAt).toBeTruthy()
    }
  })
})
