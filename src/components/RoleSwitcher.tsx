import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDemoActions, useDemoState } from '../store/DemoProvider'
import type { Actor } from '../domain/types'

const ROLE_LABELS: Record<Actor, string> = {
  furniture_maker: 'Мебельщик',
  client: 'Клиент',
  operator: 'Оператор',
}

const ROLE_HOME: Record<Actor, string> = {
  furniture_maker: '/furniture-maker',
  client: '/furniture-maker',
  operator: '/operator',
}

const DEAL_ID_FROM_PATH = /^\/(?:furniture-maker|operator|client)\/deal\/([^/]+)$/

export function RoleSwitcher() {
  const { role } = useDemoState()
  const { setRole } = useDemoActions()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex gap-1.5 rounded-lg bg-secondary p-1">
      {(Object.keys(ROLE_LABELS) as Actor[]).map((r) => (
        <Button
          key={r}
          type="button"
          size="sm"
          variant={role === r ? 'default' : 'ghost'}
          className={cn('shadow-none', role !== r && 'hover:bg-background')}
          onClick={() => {
            setRole(r)
            const dealId = location.pathname.match(DEAL_ID_FROM_PATH)?.[1]
            if (r === 'client') {
              if (dealId) navigate(`/client/deal/${dealId}`)
              return
            }
            navigate(dealId ? `${ROLE_HOME[r]}/deal/${dealId}` : ROLE_HOME[r])
          }}
        >
          {ROLE_LABELS[r]}
        </Button>
      ))}
    </div>
  )
}
