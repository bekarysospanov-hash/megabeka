import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemoState } from '../store/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'
import { CategoryTag } from '../components/CategoryTag'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { daysSinceLastChange, isDealStalled } from '../domain/attention'
import { STATUS_LABELS, formatMoney } from '../domain/statusLabels'
import type { Deal, DealStatus, RevisionEntry } from '../domain/types'

// Споры — на первом месте (как и раньше), зависшие сделки без движения — следом, чтобы не
// требовать от сторон обязательно нажимать «Позвать оператора» самим (раздел 12 PRD, №7).
function priority(deal: Deal, revisions: RevisionEntry[]): number {
  if (deal.status === 'dispute_open') return 2
  if (isDealStalled(deal, revisions)) return 1
  return 0
}

export function OperatorDealsList() {
  const { deals, revisions } = useDemoState()
  const [filter, setFilter] = useState<DealStatus | 'all'>('all')

  const list = Object.values(deals)
    .filter((d) => filter === 'all' || d.status === filter)
    .sort((a, b) => priority(b, revisions) - priority(a, revisions))

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Все сделки</h1>

      <Select value={filter} onValueChange={(v) => setFilter(v as DealStatus | 'all')}>
        <SelectTrigger className="w-fit min-w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <SelectItem key={status} value={status}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid gap-3">
        {list.map((deal) => (
          <Link key={deal.id} to={`/operator/deal/${deal.id}`}>
            <Card
              className={
                deal.status === 'dispute_open'
                  ? 'border-destructive/40 bg-destructive/5 p-4 transition-colors hover:border-destructive/60'
                  : isDealStalled(deal, revisions)
                    ? 'border-warning/40 bg-warning/5 p-4 transition-colors hover:border-warning/60'
                    : 'p-4 transition-colors hover:border-primary/40 hover:bg-accent/40'
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{deal.title}</div>
                    <CategoryTag category={deal.category} />
                    {deal.status === 'dispute_open' && (
                      <span className="text-xs font-medium text-destructive">⚠ требует внимания</span>
                    )}
                    {deal.status !== 'dispute_open' && isDealStalled(deal, revisions) && (
                      <span className="text-xs font-medium text-warning">
                        ⚠ {daysSinceLastChange(deal, revisions)} дн. без движения
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {deal.clientName ? (
                      <>
                        {deal.clientName}
                        {deal.clientPhone && <span className="text-muted-foreground/70"> · {deal.clientPhone}</span>}
                      </>
                    ) : (
                      'Клиент ещё не подключился'
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="font-semibold">{formatMoney(deal.amount)}</div>
                  <StatusBadge status={deal.status} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
