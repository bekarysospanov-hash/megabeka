import { Link, useLocation } from 'react-router-dom'
import { LayoutList, PlusCircle, ShieldCheck, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutList
  exact?: boolean
}

const FURNITURE_MAKER_NAV: NavItem[] = [
  { to: '/furniture-maker', label: 'Мои сделки', icon: LayoutList, exact: true },
  { to: '/furniture-maker/new', label: 'Новая сделка', icon: PlusCircle },
  { to: '/furniture-maker/balance', label: 'Баланс', icon: Wallet, exact: true },
]

const OPERATOR_NAV: NavItem[] = [
  { to: '/operator', label: 'Все сделки', icon: ShieldCheck, exact: true },
  { to: '/operator/guarantee-reserve', label: 'Резерв гарантии', icon: Wallet, exact: true },
]

export function Sidebar() {
  const location = useLocation()
  const isOperator = location.pathname.startsWith('/operator')
  const items = isOperator ? OPERATOR_NAV : FURNITURE_MAKER_NAV

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background md:block">
      <nav className="sticky top-[calc(3.5rem+2.5rem)] flex flex-col gap-1 p-3">
        {items.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
