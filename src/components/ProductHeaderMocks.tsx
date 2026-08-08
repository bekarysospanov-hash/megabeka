import { Bell } from 'lucide-react'

export function ProductHeaderMocks() {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Bell className="h-[18px] w-[18px]" aria-hidden />
      <div className="h-7 w-7 rounded-full bg-secondary" aria-hidden />
    </div>
  )
}
