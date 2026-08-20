import { describe, expect, it } from 'vitest'
import {
  callOperator,
  cancelDeal,
  clientAccepts,
  createDeal,
  freezeDispute,
  markProductionDone,
  onboardClient,
  pay,
  rejectAct,
  requestRevision,
  requestRevisions,
  resolveDispute,
  retryPayment,
  sendToClient,
  signAct,
  signActByFurnitureMaker,
  signByClientSms,
  signByFurnitureMaker,
  submitPayment,
  updateDealSpec,
} from './dealMachine'
import { seedScenarios } from './seedScenarios'
import { buildMilestones, takeMilestoneAdvance } from './milestones'
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
  const deal = toInProduction()
  return markProductionDone(deal, takeMilestoneAdvance(buildMilestones(deal), 1, 'in_production', false))
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

  it('дефолты полей формы заявки: мультиселекты — пустые массивы, подсветка выключена, остальное — null', () => {
    const deal = createDeal(baseInput)
    expect(deal.configuration).toBeNull()
    expect(deal.specialMechanisms).toEqual([])
    expect(deal.appliances).toEqual([])
    expect(deal.lightingNeeded).toBe(false)
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

describe('updateDealSpec', () => {
  it('обновляет поля спецификации черновика', () => {
    const deal = updateDealSpec(createDeal(baseInput), {
      title: 'Диван на заказ',
      amount: 500_000,
      prepaymentPercent: 50,
      finalPercent: 50,
      commissionPercent: 10,
      contactName: 'Айгерим',
      contactPhone: '+77009998877',
      category: 'upholstered',
      hasUpholstery: true,
      heightMm: 900,
      depthMm: 1000,
      lengthMm: null,
      material: 'mdf',
      facadeColor: 'серый велюр',
      qualityTier: 'premium',
      hardwareTier: 'mid',
      estimatedProductionDays: 21,
    })
    expect(deal.title).toBe('Диван на заказ')
    expect(deal.amount).toBe(500_000)
    expect(deal.contactName).toBe('Айгерим')
    expect(deal.category).toBe('upholstered')
    expect(deal.hasUpholstery).toBe(true)
    expect(deal.facadeColor).toBe('серый велюр')
    expect(deal.estimatedProductionDays).toBe(21)
    expect(deal.status).toBe('draft')
  })

  it('не меняет статус и историю статусов', () => {
    const before = createDeal(baseInput)
    const after = updateDealSpec(before, { ...baseInput, title: 'Новое название' })
    expect(after.status).toBe(before.status)
    expect(after.statusHistory).toEqual(before.statusHistory)
  })

  it('бросает ошибку вне draft и negotiation', () => {
    const deal = toAwaitingClient()
    expect(() => updateDealSpec(deal, { ...baseInput })).toThrow()
  })

  it('работает в negotiation и сбрасывает clientAccepted, если клиент уже согласился', () => {
    const accepted = clientAccepts(toNegotiation())
    expect(accepted.clientAccepted).toBe(true)

    const updated = updateDealSpec(accepted, { ...baseInput, amount: 900_000 })
    expect(updated.status).toBe('negotiation')
    expect(updated.amount).toBe(900_000)
    expect(updated.clientAccepted).toBe(false)
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
    expect(revision.requestId).toBeTruthy()
  })

  it('два отдельных вызова получают разные requestId, даже если совпадёт at', () => {
    const deal = toNegotiation()
    const first = requestRevision(deal, 'amount', '1000000', '950000', '')
    const second = requestRevision(deal, 'deadline', '10', '14', '')
    expect(first.revision.requestId).not.toBe(second.revision.requestId)
  })
})

describe('requestRevisions', () => {
  it('недоступен вне negotiation', () => {
    expect(() =>
      requestRevisions(toAwaitingClient(), [{ field: 'amount', oldValue: '1', newValue: '2' }], ''),
    ).toThrow()
  })

  it('создаёт по записи на каждое изменённое поле, все с одинаковым at и комментарием', () => {
    const deal = toNegotiation()
    const { deal: updated, revisions } = requestRevisions(
      deal,
      [
        { field: 'material', oldValue: 'ЛДСП Стандарт', newValue: 'МДФ' },
        { field: 'heightMm', oldValue: '—', newValue: '2500' },
      ],
      'нужен апгрейд',
    )
    expect(updated.status).toBe('negotiation')
    expect(revisions).toHaveLength(2)
    expect(revisions[0].at).toBe(revisions[1].at)
    // requestId — не at: две отдельные группы теоретически могут получить одинаковую метку
    // времени (миллисекундная точность у Date.toISOString), группировка в UI полагается на id.
    expect(revisions[0].requestId).toBe(revisions[1].requestId)
    expect(revisions[0].requestId).toBeTruthy()
    expect(revisions.every((r) => r.comment === 'нужен апгрейд')).toBe(true)
    expect(revisions[0].field).toBe('material')
    expect(revisions[1].field).toBe('heightMm')
  })

  it('сбрасывает clientAccepted, как и одиночный requestRevision', () => {
    const accepted = clientAccepts(toNegotiation())
    const { deal } = requestRevisions(accepted, [{ field: 'amount', oldValue: '1', newValue: '2' }], '')
    expect(deal.clientAccepted).toBe(false)
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

  it('не создаёт транш: деньги раскрываются только после подтверждения этапа (FR-14)', () => {
    const result = pay(toPaymentProcessing())
    expect(result).not.toHaveProperty('transaction')
  })

  it('строит этапы из согласованной схемы траншей', () => {
    const { milestones } = pay(toPaymentProcessing())
    expect(milestones.length).toBeGreaterThan(0)
    expect(milestones.every((m) => m.status === 'planned')).toBe(true)
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

  // FR-19: иначе сделка уходит к приёмке с нераскрытой долей, и деньги мебельщика остаются
  // на платформе без адресата — забрать их после закрытия сделки уже нечем.
  it('отклоняет готовность, пока по этапу не взят транш', () => {
    const deal = toInProduction()
    const milestones = buildMilestones(deal)
    expect(() => markProductionDone(deal, milestones)).toThrow(/транш/i)
  })

  it('разрешает готовность, когда транши всех этапов взяты', () => {
    const deal = toInProduction()
    const taken = takeMilestoneAdvance(buildMilestones(deal), 1, 'in_production', false)
    expect(markProductionDone(deal, taken).status).toBe('awaiting_acceptance')
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

  it('без замечаний — acceptedWithRemarks остаётся false', () => {
    const { deal } = signAct(toActSigning(), '1234')
    expect(deal.acceptedWithRemarks).toBe(false)
    expect(deal.acceptanceRemarks).toBeNull()
  })

  it('с замечаниями — сохраняет флаг и текст, но не блокирует завершение сделки и выплату', () => {
    const { deal, transaction } = signAct(toActSigning(), '1234', 'скол на дверце')
    expect(deal.status).toBe('completed')
    expect(deal.acceptedWithRemarks).toBe(true)
    expect(deal.acceptanceRemarks).toBe('скол на дверце')
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

describe('resolveDispute', () => {
  it('возвращает сделку в статус, из которого был открыт спор, и снимает frozen', () => {
    const { deal } = callOperator(toInProduction(), 'client', 'задержка сроков')
    const frozen = freezeDispute(deal)
    const { deal: resolved } = resolveDispute(frozen, { kind: 'rejected', newDeadline: '2026-09-15' })
    expect(resolved.status).toBe('in_production')
    expect(resolved.frozen).toBe(false)
  })
})

describe('retryPayment', () => {
  it('недоступен вне payment_processing', () => {
    expect(() => retryPayment(toPaymentPending())).toThrow()
    expect(() => retryPayment(toInProduction())).toThrow()
  })

  it('возвращает payment_processing в payment_pending и сбрасывает paymentMethod', () => {
    const deal = retryPayment(toPaymentProcessing())
    expect(deal.status).toBe('payment_pending')
    expect(deal.paymentMethod).toBeNull()
  })
})

describe('cancelDeal', () => {
  it('доступен на draft и awaiting_client — закрытие сделки до подписания', () => {
    expect(cancelDeal(createDeal(baseInput), 'furniture_maker', '').status).toBe('cancelled')
    expect(cancelDeal(toAwaitingClient(), 'furniture_maker', '').status).toBe('cancelled')
  })

  it('недоступен после начала обработки платежа', () => {
    expect(() => cancelDeal(toPaymentProcessing(), 'client', '')).toThrow()
    expect(() => cancelDeal(toInProduction(), 'furniture_maker', '')).toThrow()
  })

  it('доступен на negotiation/contract_signing/contract_signed/payment_pending и переводит в cancelled', () => {
    expect(cancelDeal(toNegotiation(), 'client', '').status).toBe('cancelled')
    expect(cancelDeal(toContractSigning(), 'furniture_maker', '').status).toBe('cancelled')
    expect(cancelDeal(toPaymentPending(), 'client', '').status).toBe('cancelled')
  })

  it('сохраняет, кто отменил и причину, и пишет переход в statusHistory', () => {
    const deal = cancelDeal(toNegotiation(), 'furniture_maker', 'клиент передумал')
    expect(deal.cancelledBy).toBe('furniture_maker')
    expect(deal.cancellationReason).toBe('клиент передумал')
    expect(deal.statusHistory.some((h) => h.status === 'cancelled')).toBe(true)
  })

  it('пустая причина сохраняется как null, а не пустая строка', () => {
    const deal = cancelDeal(toNegotiation(), 'client', '   ')
    expect(deal.cancellationReason).toBeNull()
  })
})

describe('rejectAct', () => {
  it('недоступен вне act_signing', () => {
    expect(() => rejectAct(toAwaitingAcceptance(), 'скол на дверце')).toThrow()
  })

  it('переводит act_signing обратно в in_production и сохраняет причину отказа', () => {
    const deal = rejectAct(toActSigning(), 'скол на дверце, нужна переделка')
    expect(deal.status).toBe('in_production')
    expect(deal.actRejectionReason).toBe('скол на дверце, нужна переделка')
    expect(deal.statusHistory[deal.statusHistory.length - 1].status).toBe('in_production')
  })

  it('пустая причина сохраняется как null, а не пустая строка', () => {
    const deal = rejectAct(toActSigning(), '   ')
    expect(deal.actRejectionReason).toBeNull()
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
