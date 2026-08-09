import type { DealStatus } from './types'

export interface ProgressStage {
  key: string
  label: string
  statuses: DealStatus[]
}

export const PROGRESS_STAGES: ProgressStage[] = [
  {
    key: 'negotiation',
    label: 'Согласование',
    statuses: ['draft', 'awaiting_client', 'negotiation'],
  },
  {
    key: 'signing',
    label: 'Подписание',
    statuses: ['contract_signing', 'contract_signed'],
  },
  {
    key: 'payment',
    label: 'Оплата',
    statuses: ['payment_pending', 'payment_processing', 'paid'],
  },
  {
    key: 'production',
    label: 'Производство',
    statuses: ['in_production'],
  },
  {
    key: 'acceptance',
    label: 'Приёмка',
    statuses: ['awaiting_acceptance', 'act_signing', 'act_signed'],
  },
  {
    key: 'completed',
    label: 'Завершено',
    statuses: ['completed'],
  },
]

export function getProgressStageIndex(status: DealStatus): number | null {
  const index = PROGRESS_STAGES.findIndex((stage) => stage.statuses.includes(status))
  return index === -1 ? null : index
}
