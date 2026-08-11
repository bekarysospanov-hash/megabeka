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

// Материал корпуса (каркаса)
export type MaterialType = 'chipboard_standard' | 'chipboard_premium' | 'mdf'

export type QualityTier = 'economy' | 'standard' | 'premium'

// Класс фурнитуры
export type HardwareTier = 'budget' | 'mid' | 'premium'

export type PaymentMethod = 'card' | 'bank'

export type DealConfiguration = 'straight' | 'l_shaped' | 'u_shaped' | 'built_in' | 'freestanding'

// Материал фасадов — отдельно от материала корпуса
export type FacadeMaterial = 'chipboard' | 'pvc_film' | 'plastic_hpl' | 'enamel_mdf' | 'veneer_solid'

export type FacadeType = 'smooth' | 'milled' | 'glass_showcase'

export type CountertopType = 'chipboard_plastic' | 'compact_plate' | 'acrylic_stone' | 'quartz_agglomerate'

export type OpeningSystem = 'handles' | 'gola_profile' | 'push_to_open'

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
  finalPercent: number
  commissionPercent: number
  category: FurnitureCategory | null
  hasUpholstery: boolean
  configuration: DealConfiguration | null
  widthCm: number | null
  heightCm: number | null
  depthCm: number | null
  lengthCm: number | null
  material: MaterialType | null
  finish: string | null
  qualityTier: QualityTier | null
  hardwareTier: HardwareTier | null
  facadeMaterial: FacadeMaterial | null
  facadeType: FacadeType | null
  countertopType: CountertopType | null
  openingSystem: OpeningSystem | null
  drawerCount: number | null
  specialMechanisms: SpecialMechanism[]
  applianceMount: ApplianceMount | null
  appliances: ApplianceItem[]
  lightingNeeded: boolean
  clientBudget: number | null
  desiredTimeline: string | null
  referenceLink: string | null
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
  finalPercent: number
  commissionPercent: number
  contactName?: string | null
  contactPhone?: string | null
  category?: FurnitureCategory | null
  hasUpholstery?: boolean
  configuration?: DealConfiguration | null
  widthCm?: number | null
  heightCm?: number | null
  depthCm?: number | null
  lengthCm?: number | null
  material?: MaterialType | null
  finish?: string | null
  qualityTier?: QualityTier | null
  hardwareTier?: HardwareTier | null
  facadeMaterial?: FacadeMaterial | null
  facadeType?: FacadeType | null
  countertopType?: CountertopType | null
  openingSystem?: OpeningSystem | null
  drawerCount?: number | null
  specialMechanisms?: SpecialMechanism[]
  applianceMount?: ApplianceMount | null
  appliances?: ApplianceItem[]
  lightingNeeded?: boolean
  clientBudget?: number | null
  desiredTimeline?: string | null
  referenceLink?: string | null
  estimatedProductionDays?: number | null
}

export type DealSpecInput = Omit<CreateDealInput, 'id' | 'furnitureMakerId'>
