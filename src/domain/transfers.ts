import { generateId } from './id'
import type { TransferRequest } from './types'

function find(requests: TransferRequest[], id: string): TransferRequest {
  const request = requests.find((r) => r.id === id)
  if (!request) throw new Error(`Запрос на перевод ${id} не найден`)
  return request
}

function replace(
  requests: TransferRequest[],
  id: string,
  patch: Partial<TransferRequest>,
): TransferRequest[] {
  return requests.map((r) => (r.id === id ? { ...r, ...patch } : r))
}

/**
 * Мебельщик запрашивает перевод части раскрытых денег. Проверки суммы держим здесь, а не
 * только в форме: гейт в интерфейсе — подсказка, а деньги двигает домен.
 */
export function createTransferRequest(
  dealId: string,
  amount: number,
  purpose: string,
  available: number,
): TransferRequest {
  // Проверку на число ставим первой: NaN из поля ввода проходит и «> 0», и «<= available»,
  // потому что любое сравнение с NaN ложно — дальше он молча превратил бы баланс в NaN.
  // Целые тенге — конвенция прототипа, дробный транш не отправить платёжкой.
  if (!Number.isInteger(amount)) {
    throw new Error('Укажите сумму перевода целым числом тенге')
  }
  if (amount <= 0) {
    throw new Error('Укажите сумму перевода больше нуля')
  }
  if (amount > available) {
    throw new Error('Сумма перевода превышает доступный баланс сделки')
  }
  if (!purpose.trim()) {
    throw new Error('Укажите цель перевода: оператор проверяет её перед выплатой')
  }

  return {
    id: generateId(),
    dealId,
    amount,
    purpose: purpose.trim(),
    requestedAt: new Date().toISOString(),
    status: 'pending',
    executedAt: null,
    rejectedAt: null,
    rejectionReason: null,
  }
}

/**
 * FR-35: оператор закрывает запрос, отправив деньги на реквизиты мебельщика.
 * Повторный вызов на исполненном запросе — не ошибка, а отсутствие эффекта: двойной клик
 * оператора не должен отправить ту же сумму второй раз.
 */
export function executeTransfer(requests: TransferRequest[], id: string): TransferRequest[] {
  const request = find(requests, id)
  if (request.status === 'executed') return requests
  if (request.status === 'rejected') {
    throw new Error('Запрос отклонён: исполнить его нельзя, мебельщик создаёт новый')
  }

  return replace(requests, id, { status: 'executed', executedAt: new Date().toISOString() })
}

/**
 * Отклонение возвращает сумму в доступный баланс сделки — иначе ошибочный запрос запирал бы
 * деньги мебельщика до конца сделки. Причина обязательна: по ней мебельщик решает, что менять.
 */
export function rejectTransfer(
  requests: TransferRequest[],
  id: string,
  reason: string,
): TransferRequest[] {
  const request = find(requests, id)
  if (request.status === 'rejected') return requests
  if (request.status === 'executed') {
    throw new Error('Запрос уже исполнен: деньги отправлены, отклонить его нельзя')
  }
  if (!reason.trim()) {
    throw new Error('Укажите причину отклонения: без неё мебельщик не поймёт, что исправлять')
  }

  return replace(requests, id, {
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason.trim(),
  })
}

/** Очередь оператора: невыплаченные транши, ожидающие решения (FR-35). */
export function pendingTransferRequests(requests: TransferRequest[]): TransferRequest[] {
  return requests.filter((r) => r.status === 'pending')
}
