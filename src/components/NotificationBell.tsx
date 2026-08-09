import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDemoActions, useDemoState, useNotifications } from '../store/DemoProvider'
import { formatDateTime } from '../domain/statusLabels'
import type { Actor } from '../domain/types'

const ROLE_DEAL_PATH: Record<Actor, string> = {
  furniture_maker: '/furniture-maker/deal',
  client: '/client/deal',
  operator: '/operator/deal',
}

// Роль для фильтрации уведомлений берётся из текущего маршрута, а не из глобального
// demo-state.role — так же, как Sidebar определяет свою навигацию по location.pathname.
// Иначе после "Сбросить демо" (сбрасывает role на furniture_maker) колокольчик на уже
// открытом клиентском экране покажет уведомления не той роли.
function useRouteRole(): Actor {
  const location = useLocation()
  if (location.pathname.startsWith('/operator')) return 'operator'
  if (location.pathname.startsWith('/client')) return 'client'
  return 'furniture_maker'
}

export function NotificationBell() {
  const { deals } = useDemoState()
  const role = useRouteRole()
  const notifications = useNotifications(role)
  const { markNotificationRead, markAllNotificationsRead } = useDemoActions()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Button variant="ghost" size="icon" aria-label="Уведомления" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Уведомления</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => markAllNotificationsRead(role)}
              >
                Прочитать все
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">Уведомлений пока нет.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                className={cn(
                  'block w-full border-b px-3 py-2.5 text-left text-xs last:border-b-0 hover:bg-accent',
                  !n.read && 'bg-info/5',
                )}
                onClick={() => {
                  markNotificationRead(n.id)
                  setOpen(false)
                  navigate(`${ROLE_DEAL_PATH[role]}/${n.dealId}`)
                }}
              >
                <div className="flex items-center gap-1.5">
                  {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-info" />}
                  <span className="font-medium">{n.text}</span>
                </div>
                <div className="mt-0.5 text-muted-foreground">
                  {deals[n.dealId]?.title ?? 'Сделка'} · {formatDateTime(n.at)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
