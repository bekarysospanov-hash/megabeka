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

export type MaterialType = 'chipboard' | 'mdf' | 'solid_wood' | 'other'

export type QualityTier = 'economy' | 'standard' | 'premium'

export type HardwareTier = 'standard' | 'premium' | 'unspecified'

export type PaymentMethod = 'card' | 'bank'

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
  finalPercent: number
  commissionPercent: number
  category: FurnitureCategory | null
  hasUpholstery: boolean
  widthCm: number | null
  heightCm: number | null
  depthCm: number | null
  lengthCm: number | null
  material: MaterialType | null
  finish: string | null
  qualityTier: QualityTier | null
  hardwareTier: HardwareTier | null
  estimatedProductionDays: number | null
  status: DealStatus
  previousStatus: DealStatus | null
  frozen: boolean
  clientAccepted: boolean
  paymentMethod: PaymentMethod | null
  statusHistory: { status: DealStatus; at: string }[]
  guaranteeIssuedAt: string
}

export interface RevisionEntry {
  dealId: string
  field: string
  oldValue: string
  newValue: string
  comment: string
  at: string
}

export interface Transaction {
  dealId: string
  type: 'prepayment' | 'final'
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
  cardNumber: string
  holderName: string
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
  finalPercent: number
  commissionPercent: number
  contactName?: string | null
  contactPhone?: string | null
  category?: FurnitureCategory | null
  hasUpholstery?: boolean
  widthCm?: number | null
  heightCm?: number | null
  depthCm?: number | null
  lengthCm?: number | null
  material?: MaterialType | null
  finish?: string | null
  qualityTier?: QualityTier | null
  hardwareTier?: HardwareTier | null
  estimatedProductionDays?: number | null
}
