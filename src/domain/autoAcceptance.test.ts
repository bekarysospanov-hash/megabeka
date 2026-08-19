import { describe, expect, it } from 'vitest'
import {
  autoAcceptDeal,
  callOperator,
  createDeal,
  markProductionDone,
  pay,
  signActByFurnitureMaker,
  signByClientSms,
  signByFurnitureMaker,
  clientAccepts,
  resolveDispute,
  onboardClient,
  sendToClient,
  submitPayment,
} from './dealMachine'
import type { CreateDealInput, Deal } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Кухонный гарнитур на заказ',
  amount: 1_000_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 5,
}

/** Проводит сделку до статуса «готовность заявлена» (окно приёмки запущено). */
function dealInAcceptanceWindow(): Deal {
  let deal = createDeal(baseInput)
  deal = sendToClient(deal)
  deal = onboardClient(deal, 'Айгерим', '+77011110000')
  deal = clientAccepts(deal)
  deal = signByFurnitureMaker(deal, '1234')
  deal = signByClientSms(deal, '1234')
  deal = submitPayment(deal, 'card')
  deal = pay(deal).deal
  return markProductionDone(deal)
}

describe('окно приёмки запускается заявлением готовности (FR-19, FR-20)', () => {
  it('markProductionDone проставляет срок окна приёмки', () => {
    const deal = dealInAcceptanceWindow()
    expect(deal.acceptanceDeadline).not.toBeNull()
  })

  it('до заявления готовности срока нет', () => {
    const deal = createDeal(baseInput)
    expect(deal.acceptanceDeadline).toBeNull()
  })
})

describe('autoAcceptDeal (FR-22)', () => {
  it('по истечении срока сделка принимается автоматически и порождает финальный транш', () => {
    const deal = dealInAcceptanceWindow()
    const expired = { ...deal, acceptanceDeadline: new Date(Date.now() - 1000).toISOString() }

    const { deal: accepted, transaction } = autoAcceptDeal(expired)

    expect(accepted.status).toBe('completed')
    expect(transaction.type).toBe('final')
    expect(transaction.amount).toBe(475_000)
  })

  it('фиксирует основание, отдельное от подписи клиента', () => {
    const deal = dealInAcceptanceWindow()
    const expired = { ...deal, acceptanceDeadline: new Date(Date.now() - 1000).toISOString() }

    const { deal: accepted } = autoAcceptDeal(expired)

    expect(accepted.autoAcceptedAt).not.toBeNull()
    expect(accepted.acceptedWithRemarks).toBe(false)
  })

  it('до истечения срока авто-приёмка невозможна', () => {
    const deal = dealInAcceptanceWindow()
    const notExpired = {
      ...deal,
      acceptanceDeadline: new Date(Date.now() + 60_000).toISOString(),
    }
    expect(() => autoAcceptDeal(notExpired)).toThrow(/срок/i)
  })

  it('работает и после того, как мебельщик подписал акт: подписи клиента всё равно нет', () => {
    const deal = signActByFurnitureMaker(dealInAcceptanceWindow(), '1234')
    const expired = { ...deal, acceptanceDeadline: new Date(Date.now() - 1000).toISOString() }

    expect(autoAcceptDeal(expired).deal.status).toBe('completed')
  })

  it('спор побеждает: по сделке в споре авто-приёмка не выполняется', () => {
    const deal = dealInAcceptanceWindow()
    const expired = { ...deal, acceptanceDeadline: new Date(Date.now() - 1000).toISOString() }
    const disputed = callOperator(expired, 'client', 'не тот цвет').deal

    expect(() => autoAcceptDeal(disputed)).toThrow()
  })

  it('после разрешения спора окно приёмки запускается заново, а не остаётся истёкшим', () => {
    const deal = dealInAcceptanceWindow()
    // Спор открыт в окне приёмки; за время разбора срок истёк.
    const expired = { ...deal, acceptanceDeadline: new Date(Date.now() - 1000).toISOString() }
    const disputed = callOperator(expired, 'client', 'скол на дверце').deal

    const restored = resolveDispute(disputed)

    // Иначе финальный транш ушёл бы мебельщику в ту же секунду, когда спор отклонён,
    // и клиент не успел бы даже увидеть результат разбора.
    expect(new Date(restored.acceptanceDeadline!).getTime()).toBeGreaterThan(Date.now())
    expect(() => autoAcceptDeal(restored)).toThrow(/срок/i)
  })

  it('разрешение спора вне окна приёмки срок не трогает', () => {
    let deal = createDeal(baseInput)
    deal = sendToClient(deal)
    deal = onboardClient(deal, 'Айгерим', '+77011110000')
    deal = clientAccepts(deal)
    deal = signByFurnitureMaker(deal, '1234')
    deal = signByClientSms(deal, '1234')
    deal = submitPayment(deal, 'card')
    deal = pay(deal).deal // in_production, окна приёмки ещё не было

    const restored = resolveDispute(callOperator(deal, 'client', 'работы не ведутся').deal)

    expect(restored.acceptanceDeadline).toBeNull()
  })

  it('без проставленного срока авто-приёмка невозможна', () => {
    const deal = { ...dealInAcceptanceWindow(), acceptanceDeadline: null }
    expect(() => autoAcceptDeal(deal)).toThrow(/срок/i)
  })

  it('датирует приёмку и транш переданным моментом, а не реальным «сейчас»', () => {
    const deal = dealInAcceptanceWindow()
    const afterDeadline = new Date(new Date(deal.acceptanceDeadline!).getTime() + 1000)

    const { deal: accepted, transaction } = autoAcceptDeal(deal, afterDeadline)

    // Иначе отметка о приёмке оказывается раньше срока, который служит для неё основанием.
    expect(accepted.autoAcceptedAt).toBe(afterDeadline.toISOString())
    expect(transaction.paidAt).toBe(afterDeadline.toISOString())
    expect(new Date(accepted.autoAcceptedAt!).getTime()).toBeGreaterThan(
      new Date(accepted.acceptanceDeadline!).getTime(),
    )
  })

  it('принимает момент проверки параметром и не подменяет срок сделки', () => {
    const deal = dealInAcceptanceWindow()
    const deadline = deal.acceptanceDeadline!
    const afterDeadline = new Date(new Date(deadline).getTime() + 1000)

    const { deal: accepted } = autoAcceptDeal(deal, afterDeadline)

    // Срок остался прежним: карточка показывает клиенту дату, до которой он не подписал акт.
    expect(accepted.acceptanceDeadline).toBe(deadline)
  })

  it('повторная авто-приёмка отклоняется: сделка уже завершена', () => {
    const deal = dealInAcceptanceWindow()
    const expired = { ...deal, acceptanceDeadline: new Date(Date.now() - 1000).toISOString() }
    const { deal: accepted } = autoAcceptDeal(expired)

    expect(() => autoAcceptDeal(accepted)).toThrow()
  })
})
