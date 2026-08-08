export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>© {new Date().getFullYear()} Asia Mebel · Безопасная сделка — пилот</span>
        <div className="flex gap-4">
          <span className="cursor-default opacity-60">Поддержка</span>
          <span className="cursor-default opacity-60">Документы</span>
        </div>
      </div>
    </footer>
  )
}
