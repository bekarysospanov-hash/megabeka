import { describe, expect, it } from 'vitest'
import {
  createTransferRequest,
  executeTransfer,
  pendingTransferRequests,
  rejectTransfer,
} from './transfers'
import type { TransferRequest } from './types'

function request(overrides: Partial<TransferRequest> = {}): TransferRequest {
  return {
    id: 'tr-1',
    dealId: 'deal-1',
    amount: 200_000,
    purpose: 'закуп материалов',
    requestedAt: '2026-08-01T10:00:00.000Z',
    status: 'pending',
    executedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    ...overrides,
  }
}

describe('createTransferRequest', () => {
  it('создаёт запрос в статусе «в обработке» без отметок исполнения', () => {
    const created = createTransferRequest('deal-1', 200_000, 'закуп материалов', 500_000)
    expect(created.status).toBe('pending')
    expect(created.dealId).toBe('deal-1')
    expect(created.amount).toBe(200_000)
    expect(created.executedAt).toBeNull()
    expect(created.rejectedAt).toBeNull()
    expect(created.rejectionReason).toBeNull()
  })

  it('обрезает пробелы в цели перевода', () => {
    expect(createTransferRequest('deal-1', 1000, '  фурнитура  ', 500_000).purpose).toBe('фурнитура')
  })

  it('допускает сумму, равную доступному балансу', () => {
    expect(createTransferRequest('deal-1', 500_000, 'закуп', 500_000).amount).toBe(500_000)
  })

  it('отказывает в сумме больше доступного баланса', () => {
    expect(() => createTransferRequest('deal-1', 500_001, 'закуп', 500_000)).toThrow(/доступн|баланс/i)
  })

  it('отказывает в нулевой и отрицательной сумме', () => {
    expect(() => createTransferRequest('deal-1', 0, 'закуп', 500_000)).toThrow(/сумм/i)
    expect(() => createTransferRequest('deal-1', -1000, 'закуп', 500_000)).toThrow(/сумм/i)
  })

  it('отказывает в запросе без цели', () => {
    expect(() => createTransferRequest('deal-1', 1000, '   ', 500_000)).toThrow(/цель/i)
  })

  // Number('abc') из поля ввода даёт NaN, а NaN проходит и «больше нуля», и «не больше
  // доступного»: без явной проверки такой запрос обнуляет в NaN весь денежный экран.
  it('отказывает в сумме, которая не является числом', () => {
    expect(() => createTransferRequest('deal-1', Number('abc'), 'закуп', 500_000)).toThrow(/сумм/i)
  })

  it('отказывает в бесконечной сумме', () => {
    expect(() => createTransferRequest('deal-1', Infinity, 'закуп', 500_000)).toThrow(/сумм/i)
  })

  // Деньги в прототипе — целые тенге (конвенция проекта).
  it('отказывает в дробной сумме', () => {
    expect(() => createTransferRequest('deal-1', 1000.5, 'закуп', 500_000)).toThrow(/сумм|тенге/i)
  })
})

describe('executeTransfer', () => {
  it('помечает запрос исполненным и ставит время исполнения', () => {
    const [executed] = executeTransfer([request()], 'tr-1')
    expect(executed.status).toBe('executed')
    expect(executed.executedAt).not.toBeNull()
  })

  // Двойной клик оператора не должен ни отправить деньги второй раз, ни уронить интерфейс:
  // повторное исполнение — не ошибка, а отсутствие эффекта.
  it('идемпотентно: повторное исполнение не меняет ни статус, ни время исполнения', () => {
    const once = executeTransfer([request()], 'tr-1')
    const twice = executeTransfer(once, 'tr-1')
    expect(twice).toEqual(once)
  })

  it('не исполняет отклонённый запрос', () => {
    const rejected = [request({ status: 'rejected', rejectedAt: '2026-08-02T10:00:00.000Z', rejectionReason: 'реквизиты не совпадают' })]
    expect(() => executeTransfer(rejected, 'tr-1')).toThrow(/отклон/i)
  })

  it('отказывает по неизвестному запросу', () => {
    expect(() => executeTransfer([request()], 'tr-404')).toThrow(/не найден/i)
  })

  it('не задевает остальные запросы', () => {
    const list = [request(), request({ id: 'tr-2', amount: 50_000 })]
    const updated = executeTransfer(list, 'tr-1')
    expect(updated.find((r) => r.id === 'tr-2')).toEqual(list[1])
  })
})

describe('rejectTransfer', () => {
  it('помечает запрос отклонённым с причиной и временем', () => {
    const [rejected] = rejectTransfer([request()], 'tr-1', 'реквизиты не совпадают')
    expect(rejected.status).toBe('rejected')
    expect(rejected.rejectionReason).toBe('реквизиты не совпадают')
    expect(rejected.rejectedAt).not.toBeNull()
  })

  it('отказывает в отклонении без причины: мебельщик не поймёт, что исправлять', () => {
    expect(() => rejectTransfer([request()], 'tr-1', '   ')).toThrow(/причин/i)
  })

  it('идемпотентно: повторное отклонение не переписывает причину и время', () => {
    const once = rejectTransfer([request()], 'tr-1', 'реквизиты не совпадают')
    const twice = rejectTransfer(once, 'tr-1', 'другая причина')
    expect(twice).toEqual(once)
  })

  it('не отклоняет уже исполненный запрос: деньги ушли', () => {
    const executed = [request({ status: 'executed', executedAt: '2026-08-02T10:00:00.000Z' })]
    expect(() => rejectTransfer(executed, 'tr-1', 'передумали')).toThrow(/исполнен/i)
  })

  it('отказывает по неизвестному запросу', () => {
    expect(() => rejectTransfer([request()], 'tr-404', 'причина')).toThrow(/не найден/i)
  })
})

describe('pendingTransferRequests', () => {
  it('возвращает только запросы в обработке', () => {
    const list = [
      request(),
      request({ id: 'tr-2', status: 'executed', executedAt: '2026-08-02T10:00:00.000Z' }),
      request({ id: 'tr-3', status: 'rejected', rejectedAt: '2026-08-02T10:00:00.000Z', rejectionReason: 'нет' }),
    ]
    expect(pendingTransferRequests(list).map((r) => r.id)).toEqual(['tr-1'])
  })

  it('на пустом списке возвращает пустой список', () => {
    expect(pendingTransferRequests([])).toEqual([])
  })
})
