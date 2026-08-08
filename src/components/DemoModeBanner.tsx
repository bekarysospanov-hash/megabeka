export function DemoModeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
      <strong className="font-semibold">Демо-режим.</strong> {children}
    </div>
  )
}
