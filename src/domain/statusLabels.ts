import type { DealStatus, TransferRequestStatus } from './types'

export const TRANSFER_STATUS_LABELS: Record<TransferRequestStatus, string> = {
  pending: 'В обработке',
  executed: 'Исполнен',
  rejected: 'Отклонён',
}

export const STATUS_LABELS: Record<DealStatus, string> = {
  draft: 'Черновик',
  awaiting_client: 'Ждём клиента',
  pending_approval: 'Ожидает одобрения',
  negotiation: 'Согласование условий',
  contract_signing: 'Подписание договора',
  contract_signed: 'Договор подписан',
  payment_pending: 'Ожидает оплаты',
  payment_processing: 'Платёж обрабатывается',
  paid: 'Оплачено',
  in_production: 'В производстве',
  awaiting_acceptance: 'Ожидает приёмки',
  act_signing: 'Подписание акта',
  act_signed: 'Акт подписан',
  completed: 'Завершена',
  dispute_open: 'Спор / эскалация',
  remedy: 'Устранение недостатков',
  cancelled_refunded: 'Отменена, возврат',
  cancelled: 'Отменена',
}

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

export const STATUS_TONES: Record<DealStatus, StatusTone> = {
  draft: 'neutral',
  awaiting_client: 'neutral',
  pending_approval: 'warning',
  negotiation: 'info',
  contract_signing: 'info',
  contract_signed: 'info',
  payment_pending: 'warning',
  payment_processing: 'info',
  paid: 'success',
  in_production: 'info',
  awaiting_acceptance: 'warning',
  act_signing: 'info',
  act_signed: 'success',
  completed: 'success',
  dispute_open: 'danger',
  remedy: 'warning',
  cancelled_refunded: 'danger',
  cancelled: 'neutral',
}

// Символ ₸, а не код KZT, который Intl подставляет для локали ru-RU: дизайн-спека (раздел 7)
// требует вид «1 840 000 ₸» — разряды неразрывными пробелами, знак тенге после суммы.
export function formatMoney(amount: number): string {
  const digits = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(amount)
  // Перед знаком тенге — неразрывный пробел (U+00A0): на узком мобильном экране сумма иначе
  // разрывается переносом и знак уезжает на следующую строку отдельно от числа.
  return `${digits} ₸`
}

export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '')
  return digits.length >= 4 ? `•• ${digits.slice(-4)}` : '••••'
}

// Дизайн-спека (раздел 7): «16 августа», с годом только если год не текущий. Цифровой формат
// 16.08.2026 читается как отчётная выгрузка, а лист сделки должен читаться как документ,
// написанный человеку.
//
// Правило действует только для интерфейсных текстов. Для договора и акта есть отдельный
// formatDocumentDate: юридический документ обязан нести полную дату, а акт приёмки вдобавок
// служит доказательством при разборе спора.
function isCurrentYear(date: Date): boolean {
  return date.getFullYear() === new Date().getFullYear()
}

/** Полная дата для договора и акта приёма-передачи — год не опускается никогда. */
export function formatDocumentDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(isCurrentYear(date) ? {} : { year: 'numeric' }),
  }).format(date)
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(isCurrentYear(date) ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
