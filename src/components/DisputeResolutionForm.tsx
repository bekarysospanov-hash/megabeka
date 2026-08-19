import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Money } from './Money'
import {
  ITEM_FATE_LABELS,
  REMOVAL_COST_BEARER_LABELS,
  RESOLUTION_LABELS,
  availableResolutions,
  remainderForCraftsman,
  type DisputeResolution,
  type DisputeResolutionKind,
  type ItemFate,
  type RemovalCostBearer,
} from '../domain/disputeResolution'
import type { Deal, Transaction } from '../domain/types'
import { cn } from '@/lib/utils'

/**
 * Решение арбитра по спору — четыре исхода FR-26. Форма намеренно не подставляет сумму
 * частичного возврата: её вводит человек, вычислять её за арбитра запрещено (16.2 п.18).
 * Расчёт остатка мебельщику показывается справочно, чтобы решение принималось с открытыми
 * цифрами, а не вслепую.
 */
export function DisputeResolutionForm({
  deal,
  transactions,
  onResolve,
}: {
  deal: Deal
  transactions: Transaction[]
  onResolve: (resolution: DisputeResolution) => void
}) {
  const options = availableResolutions(deal)
  const [kind, setKind] = useState<DisputeResolutionKind>(options[0])
  const [refundAmount, setRefundAmount] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [remedyDeadline, setRemedyDeadline] = useState('')
  const [itemFate, setItemFate] = useState<ItemFate>('stays_with_client')
  // Предзаполнено мебельщиком — решение PM. Арбитр может переопределить под конкретный спор.
  const [costBearer, setCostBearer] = useState<RemovalCostBearer>('craftsman')

  const paidOut = transactions
    .filter((t) => t.dealId === deal.id)
    .reduce((sum, t) => sum + t.amount, 0)
  const refundValue = Number(refundAmount) || 0
  const remainder = remainderForCraftsman(deal.amount, refundValue, paidOut)
  const isRefund = kind === 'partial_refund' || kind === 'full_refund'

  const problem =
    kind === 'rejected' && !newDeadline
      ? 'Укажите новый срок исполнения — иначе просрочка откроет спор снова'
      : kind === 'remedy' && !remedyDeadline
        ? 'Укажите срок устранения — без него у состояния нет выхода'
        : kind === 'partial_refund' && refundValue <= 0
          ? 'Укажите сумму возврата'
          : kind === 'partial_refund' && remainder < 0
            ? 'Сумма больше доступной к возврату — оформите полный возврат из резерва'
            : null

  function submit() {
    if (problem) return
    if (kind === 'rejected') return onResolve({ kind, newDeadline })
    if (kind === 'remedy') return onResolve({ kind, remedyDeadline })
    if (kind === 'full_refund') return onResolve({ kind, itemFate, removalCostBearer: costBearer })
    return onResolve({ kind, refundAmount: refundValue, itemFate, removalCostBearer: costBearer })
  }

  return (
    <div className="grid gap-3 border border-border bg-card p-4">
      <div className="text-sm font-semibold">Решение по спору</div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setKind(option)}
            className={cn(
              'border px-3 py-1.5 text-xs font-medium transition-colors',
              kind === option
                ? 'border-primary bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:border-primary/40',
            )}
          >
            {RESOLUTION_LABELS[option]}
          </button>
        ))}
      </div>

      {!options.includes('remedy') && (
        <p className="text-xs text-muted-foreground">
          {deal.previousStatus === 'remedy'
            ? '«Устранение недостатков» недоступно: цикл доработки уже назначался, повторный по регламенту не назначают.'
            : '«Устранение недостатков» недоступно: спор открыт до заявления готовности, устранять пока нечего.'}
        </p>
      )}

      {kind === 'rejected' && (
        <div className="grid gap-1.5">
          <Label htmlFor="new-deadline">Новый срок исполнения</Label>
          <Input
            id="new-deadline"
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
        </div>
      )}

      {kind === 'remedy' && (
        <div className="grid gap-1.5">
          <Label htmlFor="remedy-deadline">Срок устранения недостатков</Label>
          <Input
            id="remedy-deadline"
            type="date"
            value={remedyDeadline}
            onChange={(e) => setRemedyDeadline(e.target.value)}
          />
        </div>
      )}

      {kind === 'partial_refund' && (
        <div className="grid gap-1.5">
          <Label htmlFor="refund-amount">Сумма возврата клиенту, ₸</Label>
          <Input
            id="refund-amount"
            type="number"
            min={0}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Уже выплачено мебельщику <Money amount={paidOut} />. При этой сумме возврата ему
            причитается остаток <Money amount={Math.max(0, remainder)} />.
          </p>
        </div>
      )}

      {kind === 'full_refund' && (
        <p className="text-xs text-muted-foreground">
          Клиенту возвращается вся сумма сделки — <Money amount={deal.amount} />, включая уже
          выплаченное мебельщику. Разницу <Money amount={paidOut} /> платформа покрывает из
          собственного резерва: на счету осталось только <Money amount={deal.amount - paidOut} />.
        </p>
      )}

      {isRefund && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="item-fate">Судьба изделия</Label>
            <select
              id="item-fate"
              className="h-9 border border-input bg-transparent px-3 text-sm"
              value={itemFate}
              onChange={(e) => setItemFate(e.target.value as ItemFate)}
            >
              {Object.entries(ITEM_FATE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cost-bearer">Демонтаж и вывоз за счёт</Label>
            <select
              id="cost-bearer"
              className="h-9 border border-input bg-transparent px-3 text-sm"
              value={costBearer}
              onChange={(e) => setCostBearer(e.target.value as RemovalCostBearer)}
            >
              {Object.entries(REMOVAL_COST_BEARER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {problem && <p className="text-xs text-destructive">{problem}</p>}

      <Button size="sm" className="w-fit" disabled={Boolean(problem)} onClick={submit}>
        Вынести решение
      </Button>
    </div>
  )
}
