import { formatDateTime } from '../domain/statusLabels'
import type { RevisionEntry } from '../domain/types'

const FIELD_LABELS: Record<string, string> = {
  amount: 'Сумма',
  deadline: 'Срок изготовления',
  title: 'Товар',
}

export function RevisionDiffList({ revisions }: { revisions: RevisionEntry[] }) {
  if (revisions.length === 0) {
    return <p className="text-sm text-muted-foreground">Правок пока не было.</p>
  }

  return (
    <ul className="grid gap-2">
      {revisions.map((r, i) => (
        <li key={i} className="rounded-lg border p-3 text-sm">
          <div className="font-semibold">{FIELD_LABELS[r.field] ?? r.field}</div>
          <div className="text-muted-foreground">
            <span className="line-through">{r.oldValue}</span>{' → '}
            <span className="font-semibold text-foreground">{r.newValue}</span>
          </div>
          {r.comment && <div className="mt-1">«{r.comment}»</div>}
          <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.at)}</div>
        </li>
      ))}
    </ul>
  )
}
