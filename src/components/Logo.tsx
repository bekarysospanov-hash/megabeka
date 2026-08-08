export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        AM
      </div>
      <span className="font-semibold tracking-tight text-foreground">Asia Mebel</span>
      <span className="hidden text-sm text-muted-foreground sm:inline">· Безопасная сделка</span>
    </div>
  )
}
