export type DealStatus =
  | 'draft'
  | 'awaiting_client'
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
  widthCm: number | null
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
  actRejectionReason: string | null
  interimPaidAt: string | null
  cancellationReason: string | null
  cancelledBy: Actor | null
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
  type: 'prepayment' | 'interim' | 'final'
  amount: number
  status: 'paid'
  paidAt: string
}

export interface DisputeLog {
  dealId: string
  openedBy: Actor
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

export interface TransferRequest {
  id: string
  dealId: string
  amount: number
  purpose: string
  requestedAt: string
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
  widthCm?: number | null
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
