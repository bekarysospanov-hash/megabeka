import { generateId } from './id'
import type {
  Actor,
  CreateDealInput,
  Deal,
  DealSpecInput,
  DealStatus,
  DisputeLog,
  PaymentMethod,
  RevisionEntry,
  Transaction,
} from './types'

export const EDITABLE_STATUSES: DealStatus[] = ['draft', 'negotiation']

export const ESCALATABLE_STATUSES: DealStatus[] = [
  'negotiation',
  'contract_signing',
  'contract_signed',
  'payment_pending',
  'payment_processing',
  'paid',
  'in_production',
  'awaiting_acceptance',
  'act_signing',
]

// До payment_processing деньги ещё не двигались — лёгкая отмена закрывает сделку сразу,
// без формального спора/эскалации оператору. После — только через callOperator/initiateRefund,
// потому что там уже есть деньги, которые нужно по-настоящему возвращать.
export const CANCELLABLE_STATUSES: DealStatus[] = [
  'negotiation',
  'contract_signing',
  'contract_signed',
  'payment_pending',
]

export function generateDealId(): string {
  return generateId()
}

function withStatus(deal: Deal, status: DealStatus): Deal {
  return {
    ...deal,
    status,
    statusHistory: [...deal.statusHistory, { status, at: new Date().toISOString() }],
  }
}

function assertStatus(deal: Deal, expected: DealStatus): void {
  if (deal.status !== expected) {
    throw new Error(
      `Недопустимый переход: сделка в статусе "${deal.status}", ожидался "${expected}"`,
    )
  }
}

function assertStatusOneOf(deal: Deal, expected: DealStatus[]): void {
  if (!expected.includes(deal.status)) {
    throw new Error(
      `Недопустимый переход: сделка в статусе "${deal.status}", ожидался один из [${expected.join(', ')}]`,
    )
  }
}

function netAmount(deal: Deal, percent: number): number {
  const gross = (deal.amount * percent) / 100
  const commission = (gross * deal.commissionPercent) / 100
  return gross - commission
}

function specFields(input: DealSpecInput) {
  return {
    title: input.title,
    amount: input.amount,
    prepaymentPercent: input.prepaymentPercent,
    finalPercent: input.finalPercent,
    commissionPercent: input.commissionPercent,
    contactName: input.contactName ?? null,
    contactPhone: input.contactPhone ?? null,
    category: input.category ?? null,
    hasUpholstery: input.hasUpholstery ?? false,
    widthCm: input.widthCm ?? null,
    heightCm: input.heightCm ?? null,
    depthCm: input.depthCm ?? null,
    lengthCm: input.lengthCm ?? null,
    material: input.material ?? null,
    finish: input.finish ?? null,
    qualityTier: input.qualityTier ?? null,
    hardwareTier: input.hardwareTier ?? null,
    estimatedProductionDays: input.estimatedProductionDays ?? null,
  }
}

export function dealToSpecInput(deal: Deal): DealSpecInput {
  return {
    title: deal.title,
    amount: deal.amount,
    prepaymentPercent: deal.prepaymentPercent,
    finalPercent: deal.finalPercent,
    commissionPercent: deal.commissionPercent,
    contactName: deal.contactName,
    contactPhone: deal.contactPhone,
    category: deal.category,
    hasUpholstery: deal.hasUpholstery,
    widthCm: deal.widthCm,
    heightCm: deal.heightCm,
    depthCm: deal.depthCm,
    lengthCm: deal.lengthCm,
    material: deal.material,
    finish: deal.finish,
    qualityTier: deal.qualityTier,
    hardwareTier: deal.hardwareTier,
    estimatedProductionDays: deal.estimatedProductionDays,
  }
}

export function createDeal(input: CreateDealInput): Deal {
  const id = input.id ?? generateDealId()
  return {
    id,
    slug: id,
    furnitureMakerId: input.furnitureMakerId,
    clientName: null,
    clientPhone: null,
    ...specFields(input),
    status: 'draft',
    previousStatus: null,
    frozen: false,
    clientAccepted: false,
    paymentMethod: null,
    statusHistory: [{ status: 'draft', at: new Date().toISOString() }],
    guaranteeIssuedAt: new Date().toISOString(),
    acceptedWithRemarks: false,
    acceptanceRemarks: null,
    cancellationReason: null,
    cancelledBy: null,
    measurementConfirmedAt: null,
  }
}

export function updateDealSpec(deal: Deal, input: DealSpecInput): Deal {
  assertStatusOneOf(deal, EDITABLE_STATUSES)
  return {
    ...deal,
    // Условия изменились после того, как деньги/статус уже могли зависеть от согласия клиента —
    // повторное согласие обязательно, иначе клиент может принять устаревшие условия.
    clientAccepted: deal.status === 'negotiation' ? false : deal.clientAccepted,
    // Тот же повод, что и для clientAccepted: подтверждённый замер мог относиться к старым
    // размерам — после правки характеристик его нужно подтверждать заново.
    measurementConfirmedAt: deal.status === 'negotiation' ? null : deal.measurementConfirmedAt,
    ...specFields(input),
  }
}

export function sendToClient(deal: Deal): Deal {
  assertStatus(deal, 'draft')
  return withStatus(deal, 'awaiting_client')
}

export function onboardClient(deal: Deal, name: string, phone: string): Deal {
  assertStatus(deal, 'awaiting_client')
  return withStatus({ ...deal, clientName: name, clientPhone: phone }, 'negotiation')
}

export function requestRevision(
  deal: Deal,
  field: string,
  oldValue: string,
  newValue: string,
  comment: string,
): { deal: Deal; revision: RevisionEntry } {
  assertStatus(deal, 'negotiation')
  const revision: RevisionEntry = {
    dealId: deal.id,
    field,
    oldValue,
    newValue,
    comment,
    at: new Date().toISOString(),
  }
  return { deal: { ...deal, clientAccepted: false }, revision }
}

export function clientAccepts(deal: Deal): Deal {
  assertStatus(deal, 'negotiation')
  return { ...deal, clientAccepted: true }
}

export function signByFurnitureMaker(deal: Deal, _code: string): Deal {
  assertStatus(deal, 'negotiation')
  if (!deal.clientAccepted) {
    throw new Error('Мебельщик не может подписать: клиент ещё не принял условия')
  }
  return withStatus(deal, 'contract_signing')
}

export function signByClientSms(deal: Deal, _code: string): Deal {
  assertStatus(deal, 'contract_signing')
  return withStatus(withStatus(deal, 'contract_signed'), 'payment_pending')
}

export function submitPayment(deal: Deal, method: PaymentMethod): Deal {
  assertStatus(deal, 'payment_pending')
  return withStatus({ ...deal, paymentMethod: method }, 'payment_processing')
}

// Демо-отказ банка/таймаут при обработке платежа — не реальный сбой эквайринга, а
// смоделированное состояние. Возвращает к выбору способа оплаты; paymentMethod сбрасывается,
// потому что попытка не удалась и метод не считается подтверждённым.
export function retryPayment(deal: Deal): Deal {
  assertStatus(deal, 'payment_processing')
  return withStatus({ ...deal, paymentMethod: null }, 'payment_pending')
}

export function pay(deal: Deal): { deal: Deal; transaction: Transaction } {
  assertStatus(deal, 'payment_processing')
  const transaction: Transaction = {
    dealId: deal.id,
    type: 'prepayment',
    amount: netAmount(deal, deal.prepaymentPercent),
    status: 'paid',
    paidAt: new Date().toISOString(),
  }
  const advanced = withStatus(withStatus(deal, 'paid'), 'in_production')
  return { deal: advanced, transaction }
}

export function markProductionDone(deal: Deal): Deal {
  assertStatus(deal, 'in_production')
  return withStatus(deal, 'awaiting_acceptance')
}

export function signActByFurnitureMaker(deal: Deal, _code: string): Deal {
  assertStatus(deal, 'awaiting_acceptance')
  return withStatus(deal, 'act_signing')
}

export function signAct(
  deal: Deal,
  _code: string,
  remarks?: string | null,
): { deal: Deal; transaction: Transaction } {
  assertStatus(deal, 'act_signing')
  const transaction: Transaction = {
    dealId: deal.id,
    type: 'final',
    amount: netAmount(deal, deal.finalPercent),
    status: 'paid',
    paidAt: new Date().toISOString(),
  }
  const trimmedRemarks = remarks?.trim() || null
  const completed = withStatus(
    withStatus(
      { ...deal, acceptedWithRemarks: trimmedRemarks !== null, acceptanceRemarks: trimmedRemarks },
      'act_signed',
    ),
    'completed',
  )
  return { deal: completed, transaction }
}

export function callOperator(
  deal: Deal,
  openedBy: Actor,
  reason: string,
): { deal: Deal; dispute: DisputeLog } {
  if (!ESCALATABLE_STATUSES.includes(deal.status)) {
    throw new Error(`Эскалация недоступна на статусе "${deal.status}"`)
  }
  const dispute: DisputeLog = {
    dealId: deal.id,
    openedBy,
    reason,
    status: 'open',
  }
  const updated: Deal = {
    ...withStatus(deal, 'dispute_open'),
    previousStatus: deal.status,
  }
  return { deal: updated, dispute }
}

export function freezeDispute(deal: Deal): Deal {
  assertStatus(deal, 'dispute_open')
  return { ...deal, frozen: true }
}

export function initiateRefund(deal: Deal): Deal {
  assertStatus(deal, 'dispute_open')
  return withStatus(deal, 'cancelled_refunded')
}

export function resolveDispute(deal: Deal): Deal {
  assertStatus(deal, 'dispute_open')
  if (!deal.previousStatus) {
    throw new Error('Нет статуса для возврата: previousStatus не задан')
  }
  const restored = withStatus({ ...deal, frozen: false }, deal.previousStatus)
  return { ...restored, previousStatus: null }
}

export function cancelDeal(deal: Deal, actor: Actor, reason: string): Deal {
  assertStatusOneOf(deal, CANCELLABLE_STATUSES)
  const trimmedReason = reason.trim() || null
  return withStatus({ ...deal, cancelledBy: actor, cancellationReason: trimmedReason }, 'cancelled')
}

export function confirmMeasurement(deal: Deal): Deal {
  assertStatus(deal, 'negotiation')
  return { ...deal, measurementConfirmedAt: new Date().toISOString() }
}
