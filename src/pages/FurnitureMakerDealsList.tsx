import { Link } from 'react-router-dom'
import { useDemoState } from '../store/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'
import { CategoryTag } from '../components/CategoryTag'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatMoney } from '../domain/statusLabels'

export function FurnitureMakerDealsList() {
  const { deals } = useDemoState()
  const list = Object.values(deals).sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Мои сделки</h1>
        <Button asChild>
          <Link to="/furniture-maker/new">+ Новая сделка</Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {list.map((deal) => (
          <Link key={deal.id} to={`/furniture-maker/deal/${deal.id}`}>
            <Card className="p-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{deal.title}</div>
                    <CategoryTag category={deal.category} />
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
