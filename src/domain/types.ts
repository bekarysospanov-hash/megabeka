import type { DisputeResolutionKind, ItemFate, RemovalCostBearer } from './disputeResolution'

export type DealStatus =
  | 'draft'
  | 'awaiting_client'
  /** Сумма сверх лимита требует одобрения оператора до отправки клиенту (FR-44) */
  | 'pending_approval'
  | 'negotiation'
  | 'contract_signing'
  | 'contract_signed'
  | 'payment_pending'
  | 'payment_processing'
  | 'paid'
  | 'in_production'
  | 'awaiting_acceptance'
  | 'act_signing'
  | 'act_signed'
  | 'completed'
  | 'dispute_open'
  /** Исход спора «устранение недостатков» (FR-26): изделие дорабатывается в срок арбитра */
  | 'remedy'
  | 'cancelled_refunded'
  | 'cancelled'

export type Actor = 'client' | 'furniture_maker' | 'operator'

export type FurnitureCategory =
  | 'kitchen'
  | 'bedroom'
  | 'nursery'
  | 'living_room'
  | 'hallway'
  | 'upholstered'
  | 'office'
  | 'other'

export type QualityTier = 'economy' | 'standard' | 'premium'

export type PaymentMethod = 'card' | 'bank'

export type SpecialMechanism = 'lifters' | 'bottle_racks' | 'pull_out_baskets' | 'pantographs'

export type ApplianceMount = 'built_in' | 'freestanding'

export type ApplianceItem = 'fridge' | 'cooktop' | 'oven' | 'microwave' | 'dishwasher' | 'washing_machine' | 'hood'

export interface Deal {
  id: string
  slug: string
  furnitureMakerId: string
  contactName: string | null
  contactPhone: string | null
  clientName: string | null
  clientPhone: string | null
  title: string
  amount: number
  prepaymentPercent: number
  interimPercent: number
  finalPercent: number
  commissionPercent: number
  category: FurnitureCategory | null
  categoryCustom: string | null
  hasUpholstery: boolean
  configuration: string | null
  heightMm: number | null
  depthMm: number | null
  lengthMm: number | null
  material: string | null
  facadeColor: string | null
  countertopColor: string | null
  qualityTier: QualityTier | null
  hardwareTier: string | null
  facadeMaterial: string | null
  facadeType: string | null
  countertopType: string | null
  openingSystem: string | null
  drawerCount: number | null
  specialMechanisms: SpecialMechanism[]
  applianceMount: ApplianceMount | null
  appliances: ApplianceItem[]
  lightingNeeded: boolean
  estimatedProductionDays: number | null
  status: DealStatus
  previousStatus: DealStatus | null
  frozen: boolean
  clientAccepted: boolean
  paymentMethod: PaymentMethod | null
  statusHistory: { status: DealStatus; at: string }[]
  guaranteeIssuedAt: string
  acceptedWithRemarks: boolean
  acceptanceRemarks: string | null
  /** Момент истечения окна приёмки, 3 рабочих дня по календарю РК (FR-20) */
  acceptanceDeadline: string | null
  /** Заполнен, если заказ принят по истечении срока, а не подписью клиента (FR-22) */
  autoAcceptedAt: string | null
  actRejectionReason: string | null
  interimPaidAt: string | null
  cancellationReason: string | null
  cancelledBy: Actor | null
  /** Причина отказа оператора в одобрении сверхлимитной сделки (FR-44) */
  approvalRejectReason: string | null
  /** Исход последнего разрешённого спора (FR-26) */
  disputeResolution: DisputeResolutionKind | null
  /** Сумма возврата клиенту — вводит арбитр, система её не вычисляет (16.2 п.18) */
  refundAmount: number | null
  /** Часть возврата, покрытая резервом платформы. В баланс сделки не входит */
  reservePayoutAmount: number | null
  /** Срок устранения недостатков, обязателен при соответствующем исходе */
  remedyDeadline: string | null
  itemFate: ItemFate | null
  removalCostBearer: RemovalCostBearer | null
}

/** Машина состояний этапа (PRD 7.4). «Выплачен» в прототипе не отдельный статус: факт выплаты несёт Transaction. */
export type MilestoneStatus = 'planned' | 'confirmed'

export interface Milestone {
  dealId: string
  orderNo: number
  title: string
  sharePercent: number
  /** Ровно один истинный на сделку. Финальный этап закрывается приёмкой, а не мебельщиком */
  isFinal: boolean
  status: MilestoneStatus
  /** Когда мебельщик взял транш под этап; у финального — когда его закрыла приёмка */
  confirmedAt: string | null
}

export interface RevisionEntry {
  // Общий на все поля одного запроса (см. requestRevisions в dealMachine.ts) — по нему
  // группируется история правок, а не по `at`: два отдельных запроса технически могут
  // получить одинаковую метку времени (миллисекундная точность), id — нет.
  requestId: string
  dealId: string
  field: string
  oldValue: string
  newValue: string
  comment: string
  at: string
}

export interface Transaction {
  dealId: string
  /**
   * `settlement` — остаток мебельщику при частичном возврате по решению арбитра. Отделён от
   * `final`, потому что это не финальный платёж за принятую работу: акта не было и не будет,
   * и подписывать «Поступит после подписания акта» под этой суммой нельзя.
   */
  type: 'prepayment' | 'interim' | 'final' | 'settlement'
  amount: number
  status: 'paid'
  paidAt: string
}

export interface DisputeLog {
  dealId: string
  /**
   * Ровно два значения (PRD 9.2): спор открывает клиент или система по просрочке (FR-30).
   * Ни мебельщик, ни оператор такого права не имеют — тип это запрещает, а не полагается
   * на дисциплину вызывающего.
   */
  openedBy: 'client' | 'system'
  reason: string
  status: 'open' | 'resolved'
}

export interface Message {
  dealId: string
  author: Actor
  text: string
  at: string
}

export interface PayoutRequisites {
  bankName: string
  accountNumber: string
  savedAt: string
}

export interface Attachment {
  dealId: string
  dataUrl: string
  addedBy: Actor
  at: string
}

export interface NotificationEvent {
  id: string
  dealId: string
  recipientRole: Actor
  status: DealStatus
  text: string
  at: string
  read: boolean
}

export interface FurnitureMakerVerification {
  companyName: string
  businessId: string
  legalAddress: string
  verifiedAt: string
}

export type TransferRequestStatus = 'pending' | 'executed' | 'rejected'

export interface TransferRequest {
  id: string
  dealId: string
  amount: number
  purpose: string
  requestedAt: string
  // FR-35: невыплаченные транши обязаны быть видны оператору как задача, а значит запрос
  // должен уметь закрываться — без статуса он уходил в тишину, съев баланс сделки навсегда.
  status: TransferRequestStatus
  executedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
}

export interface CreateDealInput {
  id?: string
  furnitureMakerId: string
  title: string
  amount: number
  prepaymentPercent: number
  interimPercent?: number
  finalPercent: number
  commissionPercent: number
  contactName?: string | null
  contactPhone?: string | null
  category?: FurnitureCategory | null
  categoryCustom?: string | null
  hasUpholstery?: boolean
  configuration?: string | null
  heightMm?: number | null
  depthMm?: number | null
  lengthMm?: number | null
  material?: string | null
  facadeColor?: string | null
  countertopColor?: string | null
  qualityTier?: QualityTier | null
  hardwareTier?: string | null
  facadeMaterial?: string | null
  facadeType?: string | null
  countertopType?: string | null
  openingSystem?: string | null
  drawerCount?: number | null
  specialMechanisms?: SpecialMechanism[]
  applianceMount?: ApplianceMount | null
  appliances?: ApplianceItem[]
  lightingNeeded?: boolean
  estimatedProductionDays?: number | null
}

export type DealSpecInput = Omit<CreateDealInput, 'id' | 'furnitureMakerId'>
