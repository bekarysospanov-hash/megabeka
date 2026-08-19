import type { Deal, DealStatus } from './types'

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
    // «Устранение» относится к приёмке, а не к производству: изделие уже показано клиенту и
    // дорабатывается по решению арбитра, после чего готовность заявляется повторно.
    statuses: ['awaiting_acceptance', 'act_signing', 'act_signed', 'remedy'],
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

export function groupDealsByStage(deals: Deal[]): { stage: ProgressStage; deals: Deal[] }[] {
  return PROGRESS_STAGES.map((stage) => ({
    stage,
    deals: deals.filter((deal) => stage.statuses.includes(deal.status)),
  }))
}
