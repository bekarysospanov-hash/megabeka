import type { DealStatus } from './types'

export const STATUS_LABELS: Record<DealStatus, string> = {
  draft: 'Черновик',
  awaiting_client: 'Ждём клиента',
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
  cancelled_refunded: 'Отменена, возврат',
}

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

export const STATUS_TONES: Record<DealStatus, StatusTone> = {
  draft: 'neutral',
  awaiting_client: 'neutral',
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
  cancelled_refunded: 'danger',
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function maskCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '')
  return digits.length >= 4 ? `•• ${digits.slice(-4)}` : '••••'
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
