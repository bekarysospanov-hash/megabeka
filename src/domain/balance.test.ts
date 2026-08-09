import { describe, expect, it } from 'vitest'
import { calculateAvailableBalance } from './balance'
import type { Transaction, TransferRequest } from './types'

function tx(dealId: string, amount: number): Transaction {
  return { dealId, type: 'prepayment', amount, status: 'paid', paidAt: new Date().toISOString() }
}

function transfer(dealId: string, amount: number): TransferRequest {
  return { id: Math.random().toString(36), dealId, amount, purpose: 'test', requestedAt: new Date().toISOString() }
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
})
