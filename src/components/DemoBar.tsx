import { RoleSwitcher } from './RoleSwitcher'
import { ResetDemoButton } from './ResetDemoButton'

export function DemoBar() {
  return (
    <div className="border-y border-dashed bg-muted/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Демо-режим
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <RoleSwitcher />
          <ResetDemoButton />
        </div>
      </div>
    </div>
  )
}
