import { calculateAcceptanceDeadline, isAcceptanceWindowExpired } from './acceptanceWindow'
import { exceedsDealAmountLimit } from './dealLimits'
import { availableResolutions, remainderForCraftsman, type DisputeResolution } from './disputeResolution'
import { buildMilestones, firstUntakenMilestone } from './milestones'
import { generateId } from './id'
import type {
  Actor,
  CreateDealInput,
  Deal,
  DealSpecInput,
  DealStatus,
  DisputeLog,
  PaymentMethod,
  Milestone,
  RevisionEntry,
  Transaction,
} from './types'

const EDITABLE_STATUSES: DealStatus[] = ['draft', 'negotiation']

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
  // FR-24 называет «Устранение» среди состояний, из которых открывается спор. Без этого
  // мебельщик, пропавший во время доработки, запирает сделку навсегда: заявить готовность
  // повторно некому, а другого выхода из remedy нет.
  'remedy',
]

// До payment_processing деньги ещё не двигались — лёгкая отмена закрывает сделку сразу,
// без формального спора/эскалации оператору. После — только через спор и решение арбитра,
// потому что там уже есть деньги, которые нужно по-настоящему возвращать. draft/awaiting_client
// включены отдельно от остальных: там ещё не было ни подписания, ни явного согласия клиента —
// закрытие сделки на этом этапе называется в UI иначе ("Закрыть без подписания"), но это тот
// же самый переход в cancelled, тот же cancelDeal.
const CANCELLABLE_STATUSES: DealStatus[] = [
  'draft',
  'awaiting_client',
  // Ожидание одобрения — тоже до денег: мебельщик вправе закрыть сделку, не дожидаясь решения.
  'pending_approval',
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
    interimPercent: input.interimPercent ?? 0,
    finalPercent: input.finalPercent,
    commissionPercent: input.commissionPercent,
    contactName: input.contactName ?? null,
    contactPhone: input.contactPhone ?? null,
    category: input.category ?? null,
    categoryCustom: input.categoryCustom ?? null,
    hasUpholstery: input.hasUpholstery ?? false,
    configuration: input.configuration ?? null,
    heightMm: input.heightMm ?? null,
    depthMm: input.depthMm ?? null,
    lengthMm: input.lengthMm ?? null,
    material: input.material ?? null,
    facadeColor: input.facadeColor ?? null,
    countertopColor: input.countertopColor ?? null,
    qualityTier: input.qualityTier ?? null,
    hardwareTier: input.hardwareTier ?? null,
    facadeMaterial: input.facadeMaterial ?? null,
    facadeType: input.facadeType ?? null,
    countertopType: input.countertopType ?? null,
    openingSystem: input.openingSystem ?? null,
    drawerCount: input.drawerCount ?? null,
    specialMechanisms: input.specialMechanisms ?? [],
    applianceMount: input.applianceMount ?? null,
    appliances: input.appliances ?? [],
    lightingNeeded: input.lightingNeeded ?? false,
    estimatedProductionDays: input.estimatedProductionDays ?? null,
  }
}

export function dealToSpecInput(deal: Deal): DealSpecInput {
  return {
    title: deal.title,
    amount: deal.amount,
    prepaymentPercent: deal.prepaymentPercent,
    interimPercent: deal.interimPercent,
    finalPercent: deal.finalPercent,
    commissionPercent: deal.commissionPercent,
    contactName: deal.contactName,
    contactPhone: deal.contactPhone,
    category: deal.category,
    categoryCustom: deal.categoryCustom,
    hasUpholstery: deal.hasUpholstery,
    configuration: deal.configuration,
    heightMm: deal.heightMm,
    depthMm: deal.depthMm,
    lengthMm: deal.lengthMm,
    material: deal.material,
    facadeColor: deal.facadeColor,
    countertopColor: deal.countertopColor,
    qualityTier: deal.qualityTier,
    hardwareTier: deal.hardwareTier,
    facadeMaterial: deal.facadeMaterial,
    facadeType: deal.facadeType,
    countertopType: deal.countertopType,
    openingSystem: deal.openingSystem,
    drawerCount: deal.drawerCount,
    specialMechanisms: deal.specialMechanisms,
    applianceMount: deal.applianceMount,
    appliances: deal.appliances,
    lightingNeeded: deal.lightingNeeded,
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
    acceptanceDeadline: null,
    autoAcceptedAt: null,
    actRejectionReason: null,
    interimPaidAt: null,
    cancellationReason: null,
    cancelledBy: null,
    approvalRejectReason: null,
    disputeResolution: null,
    refundAmount: null,
    reservePayoutAmount: null,
    remedyDeadline: null,
    itemFate: null,
    removalCostBearer: null,
  }
}

export function updateDealSpec(deal: Deal, input: DealSpecInput): Deal {
  assertStatusOneOf(deal, EDITABLE_STATUSES)
  return {
    ...deal,
    // Условия изменились после того, как деньги/статус уже могли зависеть от согласия клиента —
    // повторное согласие обязательно, иначе клиент может принять устаревшие условия.
    clientAccepted: deal.status === 'negotiation' ? false : deal.clientAccepted,
    ...specFields(input),
  }
}

/**
 * Отправка клиенту одним действием; дальнейший маршрут определяется лимитом (FR-06).
 * Сумма сверх лимита не запрещена — она требует одобрения оператора (FR-36, FR-44).
 */
export function sendToClient(deal: Deal): Deal {
  assertStatus(deal, 'draft')
  if (exceedsDealAmountLimit(deal.amount)) {
    return withStatus({ ...deal, approvalRejectReason: null }, 'pending_approval')
  }
  return withStatus(deal, 'awaiting_client')
}

/**
 * FR-52: правка в торге подняла сумму выше лимита — сделка уходит на одобрение, а не
 * остаётся в согласовании без проверки. Согласие клиента сбрасывается: условия изменились.
 */
export function requireApproval(deal: Deal): Deal {
  assertStatus(deal, 'negotiation')
  return withStatus(
    { ...deal, clientAccepted: false, approvalRejectReason: null },
    'pending_approval',
  )
}

/**
 * Куда вернуть сделку с одобрения. FR-44: «туда, откуда пришла» — из первой отправки в
 * черновик, из правки в торге в согласование. Источник берётся из истории статусов, чтобы
 * не заводить отдельное поле, которое пришлось бы поддерживать в каждом переходе.
 */
function approvalOrigin(deal: Deal): DealStatus {
  const beforeApproval = [...deal.statusHistory]
    .reverse()
    .find((entry) => entry.status !== 'pending_approval')
  return beforeApproval?.status === 'negotiation' ? 'negotiation' : 'draft'
}

/** FR-44: оператор одобряет сверхлимитную сделку — она продолжает путь. */
export function approveDeal(deal: Deal): Deal {
  assertStatus(deal, 'pending_approval')
  return withStatus(deal, approvalOrigin(deal) === 'negotiation' ? 'negotiation' : 'awaiting_client')
}

/** FR-44: отклонение с обязательным комментарием — мебельщик должен понять причину. */
export function rejectApproval(deal: Deal, reason: string): Deal {
  assertStatus(deal, 'pending_approval')
  if (!reason.trim()) {
    throw new Error('Укажите причину отказа: без комментария мебельщик не поймёт, что менять')
  }
  return withStatus({ ...deal, approvalRejectReason: reason.trim() }, approvalOrigin(deal))
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
    requestId: generateId(),
    dealId: deal.id,
    field,
    oldValue,
    newValue,
    comment,
    at: new Date().toISOString(),
  }
  return { deal: { ...deal, clientAccepted: false }, revision }
}

// Батч из нескольких изменённых полей одним запросом — единый requestId на всю группу (не
// по одному на поле), чтобы RevisionDiffList мог надёжно сгруппировать их в одну карточку
// "было/стало" вместо N отдельных карточек на одно и то же обращение клиента. Группировка по
// requestId, а не по `at` — два отдельных запроса теоретически могут получить одинаковую
// метку времени (миллисекундная точность), id — нет.
export function requestRevisions(
  deal: Deal,
  changes: { field: string; oldValue: string; newValue: string }[],
  comment: string,
): { deal: Deal; revisions: RevisionEntry[] } {
  assertStatus(deal, 'negotiation')
  const requestId = generateId()
  const at = new Date().toISOString()
  const revisions: RevisionEntry[] = changes.map((c) => ({
    requestId,
    dealId: deal.id,
    field: c.field,
    oldValue: c.oldValue,
    newValue: c.newValue,
    comment,
    at,
  }))
  return { deal: { ...deal, clientAccepted: false }, revisions }
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

/**
 * Оплата клиентом. Транша здесь больше нет: по FR-14 деньги раскрываются мебельщику только
 * после того, как он заявил этап с фотографиями, а оператор его подтвердил. Раньше предоплата
 * уходила автоматически в момент оплаты — то есть за работу, которую никто не видел.
 *
 * Возвращает этапы, построенные из согласованной схемы траншей (FR-03).
 */
export function pay(deal: Deal): { deal: Deal; milestones: Milestone[] } {
  assertStatus(deal, 'payment_processing')
  const advanced = withStatus(withStatus(deal, 'paid'), 'in_production')
  return { deal: advanced, milestones: buildMilestones(advanced) }
}

// Заявление готовности запускает окно приёмки (FR-19): с этого момента у клиента есть
// 3 рабочих дня по календарю РК, после которых заказ считается принятым (FR-22).
export function markProductionDone(deal: Deal, milestones: Milestone[]): Deal {
  // Из «Устранения» готовность заявляется повторно (PRD 7.3): окно приёмки запускается заново
  // на полные 3 рабочих дня, потому что клиент смотрит уже переделанное изделие.
  assertStatusOneOf(deal, ['in_production', 'remedy'])

  // FR-19: сделка не уходит к приёмке с нераскрытой долей. Иначе она дойдёт до «Завершена»,
  // финальный транш выплатится, а доля за этап останется на платформе без адресата.
  const untaken = firstUntakenMilestone(milestones)
  if (untaken) {
    throw new Error(`Сначала возьмите транш по этапу «${untaken.title}»: без этого доля останется нераскрытой`)
  }
  const declaredAt = new Date().toISOString()
  return withStatus(
    { ...deal, acceptanceDeadline: calculateAcceptanceDeadline(declaredAt) },
    'awaiting_acceptance',
  )
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

/**
 * Авто-приёмка по истечении окна (FR-22). Необратимо двигает деньги в пользу мебельщика без
 * действия клиента, поэтому условий три и все проверяются здесь, а не в UI:
 *  — сделка действительно в окне приёмки (спор из него уже вывел бы её в dispute_open);
 *  — срок проставлен и истёк;
 *  — подписи клиента нет, основанием служит именно истечение срока.
 *
 * Акт остаётся подписанным только мебельщиком: отметка «принято по истечении срока» — отдельное
 * основание, а не подделанная подпись клиента.
 */
export function autoAcceptDeal(deal: Deal, now: Date = new Date()): { deal: Deal; transaction: Transaction } {
  assertStatusOneOf(deal, ['awaiting_acceptance', 'act_signing'])
  if (!deal.acceptanceDeadline) {
    throw new Error('Авто-приёмка невозможна: срок окна приёмки не проставлен')
  }
  if (!isAcceptanceWindowExpired(deal.acceptanceDeadline, now)) {
    throw new Error('Авто-приёмка невозможна: срок окна приёмки ещё не истёк')
  }

  // Момент приёмки — это `now`, а не реальное «сейчас»: иначе при промотке срока в демо
  // отметка и транш датировались бы раньше дедлайна, который служит для них основанием.
  const acceptedAt = now.toISOString()
  const transaction: Transaction = {
    dealId: deal.id,
    type: 'final',
    amount: netAmount(deal, deal.finalPercent),
    status: 'paid',
    paidAt: acceptedAt,
  }
  const completed = withStatus(
    withStatus({ ...deal, autoAcceptedAt: acceptedAt }, 'act_signed'),
    'completed',
  )
  return { deal: completed, transaction }
}

// Клиент отклоняет акт вместо подписания — не спор и не отмена: изделие возвращается
// мебельщику на доработку, деньги уже внесённые (предоплата/промежуточный транш) не трогаются.
export function rejectAct(deal: Deal, reason: string): Deal {
  assertStatus(deal, 'act_signing')
  return withStatus({ ...deal, actRejectionReason: reason.trim() || null }, 'in_production')
}

export function callOperator(
  deal: Deal,
  openedBy: DisputeLog['openedBy'],
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

/**
 * Решение арбитра по спору — один из четырёх исходов FR-26. Функция возвращает не только
 * сделку, но и денежные последствия решения, потому что они не выводятся из статуса:
 *  — `craftsmanPayout`: остаток мебельщику при частичном возврате. Без него остаток удержания
 *    остался бы без адресата, и деньги мебельщика заперлись бы навсегда;
 *  — `reservePayout`: часть возврата сверх того, что ещё лежит на счету платформы. Это
 *    собственные деньги платформы, они питают контр-метрику и в баланс сделки не входят.
 *
 * Сумму частичного возврата вводит арбитр: вычислять её за него запрещено (16.2 п.18).
 */
export function resolveDispute(
  deal: Deal,
  resolution: DisputeResolution,
  transactions: Transaction[] = [],
): { deal: Deal; craftsmanPayout: Transaction | null; reservePayout: number } {
  assertStatus(deal, 'dispute_open')
  if (!deal.previousStatus) {
    throw new Error('Нет статуса для возврата: previousStatus не задан')
  }
  if (!availableResolutions(deal).includes(resolution.kind)) {
    throw new Error(
      'Исход «устранение недостатков» доступен только при споре из окна приёмки: до заявления готовности устранять нечего',
    )
  }

  const paidOut = transactions
    .filter((t) => t.dealId === deal.id)
    .reduce((sum, t) => sum + t.amount, 0)
  const decided = {
    ...deal,
    frozen: false,
    disputeResolution: resolution.kind,
  }

  if (resolution.kind === 'remedy') {
    if (!resolution.remedyDeadline.trim()) {
      throw new Error('Исход «устранение недостатков» без срока не имеет выхода: укажите срок')
    }
    const restored = withStatus({ ...decided, remedyDeadline: resolution.remedyDeadline }, 'remedy')
    return { deal: { ...restored, previousStatus: null }, craftsmanPayout: null, reservePayout: 0 }
  }

  if (resolution.kind === 'partial_refund' || resolution.kind === 'full_refund') {
    const refundAmount =
      resolution.kind === 'full_refund' ? deal.amount : resolution.refundAmount

    if (refundAmount <= 0) {
      throw new Error('Укажите сумму возврата: система не вычисляет её за арбитра')
    }
    const remainder = remainderForCraftsman(deal.amount, refundAmount, paidOut)
    if (remainder < 0 && resolution.kind === 'partial_refund') {
      throw new Error(
        'Сумма превышает доступную к возврату при уже сделанных выплатах — оформите полный возврат из резерва',
      )
    }

    // Резерв расходуется на ту часть возврата, которой на счету платформы уже нет.
    const heldAmount = deal.amount - paidOut
    const reservePayout = Math.max(0, refundAmount - heldAmount)

    const craftsmanPayout: Transaction | null =
      resolution.kind === 'partial_refund' && remainder > 0
        ? {
            dealId: deal.id,
            type: 'settlement',
            amount: remainder,
            status: 'paid',
            paidAt: new Date().toISOString(),
          }
        : null

    const settled = withStatus(
      {
        ...decided,
        refundAmount,
        reservePayoutAmount: reservePayout,
        itemFate: resolution.itemFate,
        removalCostBearer: resolution.removalCostBearer,
      },
      'cancelled_refunded',
    )
    return { deal: { ...settled, previousStatus: null }, craftsmanPayout, reservePayout }
  }

  if (!resolution.newDeadline.trim()) {
    throw new Error(
      'Отклоняя спор, укажите новый срок исполнения: иначе просрочка немедленно откроет спор снова',
    )
  }
  // Разбор спора съедает окно приёмки: к моменту возврата срок обычно уже истёк, и
  // авто-приёмка сработала бы в ту же секунду — деньги ушли бы мебельщику раньше, чем клиент
  // увидит результат разбора. Окно запускается заново на полные 3 рабочих дня, тем же
  // правилом, что FR-22 задаёт для отсчёта, остановленного недоставленным уведомлением.
  const returnsToAcceptanceWindow =
    deal.previousStatus === 'awaiting_acceptance' || deal.previousStatus === 'act_signing'
  const restored = withStatus(
    {
      ...decided,
      acceptanceDeadline: returnsToAcceptanceWindow
        ? calculateAcceptanceDeadline(new Date().toISOString())
        : deal.acceptanceDeadline,
    },
    deal.previousStatus,
  )
  return {
    deal: { ...restored, previousStatus: null },
    craftsmanPayout: null,
    reservePayout: 0,
  }
}

export function cancelDeal(deal: Deal, actor: Actor, reason: string): Deal {
  assertStatusOneOf(deal, CANCELLABLE_STATUSES)
  const trimmedReason = reason.trim() || null
  return withStatus({ ...deal, cancelledBy: actor, cancellationReason: trimmedReason }, 'cancelled')
}
