const DAY_MS = 24 * 60 * 60 * 1000

export interface AcceptanceReminder {
  kind: 'halfway' | 'final'
  at: string
  text: string
}

/**
 * Два напоминания в окне приёмки (FR-23): на половине срока и за сутки до истечения. Второе
 * обязано явно предупреждать об авто-приёмке и называть дату — по PRD молчание клиента может
 * стоить ему денег, и он должен знать об этом заранее, а не узнать постфактум.
 *
 * В прототипе напоминания не отправляются: SMS-контур здесь имитируется, а таймеров нет
 * сознательно — управление демонстрацией остаётся у человека. Функция считает расписание,
 * чтобы клиент видел его в блоке дедлайна: механика показана, отправка не имитируется.
 */
export function acceptanceReminders(
  readinessDeclaredAt: string,
  deadlineIso: string,
): AcceptanceReminder[] {
  const start = new Date(readinessDeclaredAt).getTime()
  const deadline = new Date(deadlineIso).getTime()

  const halfway = start + (deadline - start) / 2
  // За сутки до конца, но не раньше середины: на коротком окне обе точки схлопываются,
  // и порядок «сначала половина, потом финальное» должен сохраниться.
  const beforeDeadline = Math.max(halfway, deadline - DAY_MS)

  return [
    // Тексты — продолжение фразы «Напомним дважды: <дата> — …», поэтому без повторного
    // «напомним» и с маленькой буквы.
    {
      kind: 'halfway',
      at: new Date(halfway).toISOString(),
      text: 'что стоит осмотреть работу',
    },
    {
      kind: 'final',
      at: new Date(beforeDeadline).toISOString(),
      text: 'что срок истекает и работа будет принята автоматически',
    },
  ]
}
