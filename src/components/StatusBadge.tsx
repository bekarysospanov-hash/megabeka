import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_TONES } from '../domain/statusLabels'
import type { DealStatus } from '../domain/types'

export function StatusBadge({ status }: { status: DealStatus }) {
  return <Badge variant={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
}
