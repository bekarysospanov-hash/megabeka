// Продуктовые лимиты сделки из PRD v1.7. Все значения — решения PM, не подбираются
// разработчиком (раздел 16.2 «Что запрещено додумывать», пп. 2 и 3): изменить их может
// только новая версия PRD, но не настройка в админке и не форма.

/** FR-36: сумма одной сделки без ручного одобрения оператора. Решение PM. */
export const DEAL_AMOUNT_LIMIT = 2_000_000

/** FR-04: совокупная доля этапов, выплачиваемых до приёмки. Решение PM. */
export const PRE_ACCEPTANCE_SHARE_CAP = 50

/**
 * Ставка комиссии платформы. Решение PM (закрывает вопрос 26 из 13.3): 5% на пилот.
 *
 * По FR-16 и модели данных 7.1 ставка должна быть настройкой с возможностью индивидуального
 * переопределения на мебельщика. В прототипе она сознательно захардкожена: экран настроек
 * ради одного числа демонстрации не нужен. `Deal.commissionPercent` при этом остаётся полем
 * сделки и фиксируется на момент создания — модель к гибкой ставке готова, меняется только
 * источник значения по умолчанию.
 */
export const DEFAULT_COMMISSION_PERCENT = 5

export interface SplitValidation {
  valid: boolean
  error?: string
}

/**
 * Доля, уходящая мебельщику до приёмки заказа клиентом: предоплата плюс промежуточный
 * транш. Финальный транш в неё не входит — он выплачивается только после приёмки.
 */
export function preAcceptanceShare(prepaymentPercent: number, interimPercent: number): number {
  return prepaymentPercent + interimPercent
}

/**
 * Проверка схемы траншей по FR-03/FR-04.
 *
 * Порядок проверок значим: потолок до приёмки называется раньше несходящейся суммы долей,
 * потому что он конкретнее — говорит, какое именно правило нарушено, а не просто «не 100».
 * Нулевой финал проверяется до суммы по той же причине.
 */
export function validatePaymentSplit(
  prepaymentPercent: number,
  interimPercent: number,
  finalPercent: number,
): SplitValidation {
  const preAcceptance = preAcceptanceShare(prepaymentPercent, interimPercent)

  if (preAcceptance > PRE_ACCEPTANCE_SHARE_CAP) {
    return {
      valid: false,
      error: `До приёмки можно выплатить не больше ${PRE_ACCEPTANCE_SHARE_CAP}% суммы сделки, в этой схеме — ${preAcceptance}%.`,
    }
  }

  if (finalPercent <= 0) {
    return {
      valid: false,
      error: 'Доля финального этапа должна быть больше нуля: иначе после приёмки клиенту нечем удерживать исполнителя.',
    }
  }

  const total = prepaymentPercent + interimPercent + finalPercent
  if (total !== 100) {
    return {
      valid: false,
      error: `Сумма долей должна быть равна 100%, сейчас — ${total}%.`,
    }
  }

  return { valid: true }
}

/** FR-36: сумма сверх лимита требует явного одобрения оператора до отправки клиенту. */
export function exceedsDealAmountLimit(amount: number): boolean {
  return amount > DEAL_AMOUNT_LIMIT
}
