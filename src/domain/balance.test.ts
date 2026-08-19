import { describe, expect, it } from 'vitest'
import { createDeal } from './dealMachine'
import { calculateAvailableBalance, calculateTotalBalance } from './balance'
import type { CreateDealInput, Transaction, TransferRequest } from './types'

const baseInput: CreateDealInput = {
  furnitureMakerId: 'fm-1',
  title: 'Шкаф-купе',
  amount: 500_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: 10,
}

function tx(dealId: string, amount: number): Transaction {
  return { dealId, type: 'prepayment', amount, status: 'paid', paidAt: new Date().toISOString() }
}

function transfer(
  dealId: string,
  amount: number,
  status: TransferRequest['status'] = 'pending',
): TransferRequest {
  return {
    id: Math.random().toString(36),
    dealId,
    amount,
    purpose: 'test',
    requestedAt: new Date().toISOString(),
    status,
    executedAt: status === 'executed' ? new Date().toISOString() : null,
    rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
    rejectionReason: status === 'rejected' ? 'test' : null,
  }
}

describe('calculateAvailableBalance', () => {
  it('без транзакций и запросов возвращает 0', () => {
    expect(calculateAvailableBalance('deal-1', [], [])).toBe(0)
  })

  it('без запросов равен сумме транзакций сделки', () => {
    const transactions = [tx('deal-1', 300_000), tx('deal-1', 200_000)]
    expect(calculateAvailableBalance('deal-1', transactions, [])).toBe(500_000)
  })

  it('уменьшается на сумму запросов на перевод', () => {
    const transactions = [tx('deal-1', 500_000)]
    const transferRequests = [transfer('deal-1', 200_000)]
    expect(calculateAvailableBalance('deal-1', transactions, transferRequests)).toBe(300_000)
  })

  it('не учитывает транзакции и запросы других сделок', () => {
    const transactions = [tx('deal-1', 500_000), tx('deal-2', 999_999)]
    const transferRequests = [transfer('deal-2', 999_999)]
    expect(calculateAvailableBalance('deal-1', transactions, transferRequests)).toBe(500_000)
  })

  it('равен 0, если сумма запросов равна сумме транзакций', () => {
    const transactions = [tx('deal-1', 500_000)]
    const transferRequests = [transfer('deal-1', 500_000)]
    expect(calculateAvailableBalance('deal-1', transactions, transferRequests)).toBe(0)
  })

  // Исполненный перевод забрал деньги со счёта сделки: если бы он перестал вычитаться,
  // мебельщик получил бы одну и ту же сумму дважды.
  it('исполненный перевод не возвращается в доступный баланс', () => {
    const transactions = [tx('deal-1', 500_000)]
    const transferRequests = [transfer('deal-1', 200_000, 'executed')]
    expect(calculateAvailableBalance('deal-1', transactions, transferRequests)).toBe(300_000)
  })

  // Отклонённый запрос денег не двинул — сумма снова доступна к запросу, иначе опечатка
  // мебельщика запирала бы баланс сделки навсегда.
  it('отклонённый запрос возвращает сумму в доступный баланс', () => {
    const transactions = [tx('deal-1', 500_000)]
    const transferRequests = [transfer('deal-1', 200_000, 'rejected')]
    expect(calculateAvailableBalance('deal-1', transactions, transferRequests)).toBe(500_000)
  })

  it('вычитает только необработанные и исполненные запросы вместе', () => {
    const transactions = [tx('deal-1', 500_000)]
    const transferRequests = [
      transfer('deal-1', 100_000, 'pending'),
      transfer('deal-1', 150_000, 'executed'),
      transfer('deal-1', 200_000, 'rejected'),
    ]
    expect(calculateAvailableBalance('deal-1', transactions, transferRequests)).toBe(250_000)
  })
})

describe('calculateTotalBalance', () => {
  it('пустой список сделок возвращает 0', () => {
    expect(calculateTotalBalance([], [], [])).toBe(0)
  })

  it('без запросов равен сумме транзакций по всем сделкам', () => {
    const dealA = createDeal(baseInput)
    const dealB = createDeal(baseInput)
    const transactions = [tx(dealA.id, 300_000), tx(dealB.id, 200_000)]
    expect(calculateTotalBalance([dealA, dealB], transactions, [])).toBe(500_000)
  })

  it('учитывает запросы на перевод по каждой сделке отдельно', () => {
    const dealA = createDeal(baseInput)
    const dealB = createDeal(baseInput)
    const transactions = [tx(dealA.id, 300_000), tx(dealB.id, 200_000)]
    const transferRequests = [transfer(dealA.id, 100_000)]
    expect(calculateTotalBalance([dealA, dealB], transactions, transferRequests)).toBe(400_000)
  })

  it('сделка без транзакций не даёт отрицательного вклада', () => {
    const dealA = createDeal(baseInput)
    const dealB = createDeal(baseInput)
    const transactions = [tx(dealA.id, 300_000)]
    expect(calculateTotalBalance([dealA, dealB], transactions, [])).toBe(300_000)
  })
})
