/**
 * Окно приёмки (FR-20): 3 рабочих дня по производственному календарю Республики Казахстан.
 * Длительность задана PRD и не является настройкой — раздел 16.2, п. 11 запрещает её выбирать.
 */
export const ACCEPTANCE_WINDOW_WORKING_DAYS = 3

/**
 * Государственные праздники РК. В боевой системе справочник ведёт оператор (интеграция 11.5),
 * здесь он захардкожен на период пилота: ошибка в календаре сдвигает срок авто-приёмки, то
 * есть двигает деньги, поэтому список пополняется осознанно, а не вычисляется.
 *
 * Формат MM-DD; переносы выходных при совпадении с субботой/воскресеньем не учитываются —
 * они объявляются постановлением на каждый год отдельно.
 */
const KZ_PUBLIC_HOLIDAYS = new Set([
  '01-01', // Новый год
  '01-02', // Новый год
  '03-08', // Международный женский день
  '03-21', // Наурыз мейрамы
  '03-22', // Наурыз мейрамы
  '03-23', // Наурыз мейрамы
  '05-01', // Праздник единства народа Казахстана
  '05-07', // День защитника Отечества
  '05-09', // День Победы
  '07-06', // День столицы
  '08-30', // День Конституции
  '10-25', // День Республики
  '12-16', // День Независимости
])

function holidayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

export function isWorkingDay(date: Date): boolean {
  const weekday = date.getDay()
  if (weekday === 0 || weekday === 6) return false
  return !KZ_PUBLIC_HOLIDAYS.has(holidayKey(date))
}

/**
 * Прибавляет к дате заданное число рабочих дней, пропуская выходные и праздники.
 * Время суток сохраняется: окно истекает в тот же час, когда была заявлена готовность.
 */
export function addWorkingDays(from: Date, workingDays: number): Date {
  const result = new Date(from.getTime())
  let remaining = workingDays
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    if (isWorkingDay(result)) remaining -= 1
  }
  return result
}

/** Момент истечения окна приёмки для сделки, по которой заявлена готовность. */
export function calculateAcceptanceDeadline(readinessDeclaredAt: string): string {
  return addWorkingDays(new Date(readinessDeclaredAt), ACCEPTANCE_WINDOW_WORKING_DAYS).toISOString()
}

/** Окно истекло — сделка может быть принята автоматически (FR-22). */
export function isAcceptanceWindowExpired(deadlineIso: string, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(deadlineIso).getTime()
}
