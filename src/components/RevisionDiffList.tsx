import { REVISION_FIELD_LABELS } from '../domain/orderSpecLabels'
import { formatDateTime } from '../domain/statusLabels'
import type { RevisionEntry } from '../domain/types'

// Один запрос правок от клиента создаёт несколько RevisionEntry с общим requestId (см.
// requestRevisions в dealMachine.ts) — группируем их в одну карточку, а не показываем
// по отдельной карточке на каждое изменённое поле.
function groupByRequest(revisions: RevisionEntry[]): RevisionEntry[][] {
  const groups = new Map<string, RevisionEntry[]>()
  for (const revision of revisions) {
    const key = revision.requestId
    const group = groups.get(key)
    if (group) group.push(revision)
    else groups.set(key, [revision])
  }
  return [...groups.values()]
}

export function RevisionDiffList({ revisions }: { revisions: RevisionEntry[] }) {
  if (revisions.length === 0) {
    return <p className="text-sm text-muted-foreground">Правок пока не было.</p>
  }

  const groups = groupByRequest(revisions)

  return (
    <ul className="grid gap-2">
      {groups.map((group) => (
        <li key={group[0].requestId} className="rounded-lg border p-3 text-sm">
          <div className="grid gap-1">
            {group.map((r, i) => (
              <div key={i}>
                <span className="font-semibold">{REVISION_FIELD_LABELS[r.field] ?? r.field}: </span>
                <span className="text-muted-foreground">
                  <span className="line-through">{r.oldValue}</span>
                  {' → '}
                  <span className="font-semibold text-foreground">{r.newValue}</span>
                </span>
              </div>
            ))}
          </div>
          {group[0].comment && <div className="mt-1">«{group[0].comment}»</div>}
          <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(group[0].at)}</div>
        </li>
      ))}
    </ul>
  )
}
