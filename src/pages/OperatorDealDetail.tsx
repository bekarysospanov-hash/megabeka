import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDeal, useDealHistory, useDemoActions, useDemoState } from '../store/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'
import { RevisionDiffList } from '../components/RevisionDiffList'
import { TransactionList } from '../components/TransactionList'
import { DisputePanel } from '../components/DisputePanel'
import { DisputeResolutionForm } from '../components/DisputeResolutionForm'
import { MessageThread } from '../components/MessageThread'
import { OrderSpecSummary } from '../components/OrderSpecSummary'
import { BackLink } from '../components/BackLink'
import { StepGuidanceCard } from '../components/StepGuidanceCard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_LABELS, formatDate } from '../domain/statusLabels'
import type { DealStatus } from '../domain/types'
import { Money } from '../components/Money'

// Статусы, вход в которые несёт обязательные данные, недоступны для ручного прыжка: он их не
// заполнит и оставит сделку в состоянии без выхода.
//   dispute_open — callOperator создаёт DisputeLog и previousStatus;
//   cancelled_refunded — только решение арбитра, с суммой возврата и судьбой изделия;
//   remedy — только решение арбитра, со сроком устранения.
const MANUAL_STATUSES = (Object.keys(STATUS_LABELS) as DealStatus[]).filter(
  (status) => status !== 'dispute_open' && status !== 'cancelled_refunded' && status !== 'remedy',
)

export function OperatorDealDetail() {
  const { id } = useParams<{ id: string }>()
  const deal = useDeal(id)
  const { revisions, transactions, disputes, messages } = useDealHistory(id)
  const { furnitureMakerVerification } = useDemoState()
  const { freezeDispute, resolveDispute, operatorSetStatus, addMessage } = useDemoActions()
  const [manualStatus, setManualStatus] = useState<DealStatus | ''>('')

  if (!deal) return <p className="text-sm text-muted-foreground">Сделка не найдена.</p>

  return (
    <div className="grid gap-6">
      <BackLink to="/operator" label="Все сделки" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{deal.title}</h1>
          <div className="text-sm text-muted-foreground">
            <Money amount={deal.amount} />
            {deal.clientName && ` · ${deal.clientName}`}
            {deal.clientPhone && ` · ${deal.clientPhone}`}
          </div>
        </div>
        <StatusBadge status={deal.status} />
      </div>

      {furnitureMakerVerification ? (
        <div className="rounded-md border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
          Мебельщик верифицирован: {furnitureMakerVerification.companyName} (БИН{' '}
          {furnitureMakerVerification.businessId}), с {formatDate(furnitureMakerVerification.verifiedAt)}
        </div>
      ) : (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
          Мебельщик не верифицирован
        </div>
      )}

      {deal.acceptedWithRemarks && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
          Клиент принял с замечаниями: «{deal.acceptanceRemarks}»
        </div>
      )}

      <StepGuidanceCard status={deal.status} actor="operator" />

      <OrderSpecSummary deal={deal} />

      <DisputePanel deal={deal} disputes={disputes} onFreeze={() => freezeDispute(deal.id)} />

      {/* Решение выносится одним из четырёх исходов FR-26, а не кнопкой «пометить решённым»:
          от исхода зависит, куда уйдут деньги и что станет с изделием. */}
      {deal.status === 'dispute_open' && (
        <DisputeResolutionForm
          // key по сделке: без ремаунта введённая сумма возврата и сроки протекли бы на
          // соседний спор, и арбитр вынес бы решение с чужой цифрой.
          key={deal.id}
          deal={deal}
          transactions={transactions}
          onResolve={(resolution) => resolveDispute(deal.id, resolution)}
        />
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">История правок</h2>
        <RevisionDiffList revisions={revisions} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Выплаты</h2>
        <TransactionList transactions={transactions} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Переписка</h2>
        <MessageThread messages={messages} onSend={(text) => addMessage(deal.id, 'operator', text)} />
      </section>

      <section className="grid gap-2">
        <h2 className="text-sm font-semibold">Вручную изменить статус</h2>
        <div className="flex gap-2">
          <Select value={manualStatus} onValueChange={(v) => setManualStatus(v as DealStatus)}>
            <SelectTrigger className="w-fit min-w-56">
              <SelectValue placeholder="Выберите статус" />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={!manualStatus}>
                Применить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Сменить статус сделки?</AlertDialogTitle>
                <AlertDialogDescription>
                  Статус изменится на «{manualStatus ? STATUS_LABELS[manualStatus] : ''}» в обход графа
                  переходов. По сделке уже могут двигаться реальные деньги — проверьте, что это осознанное
                  ручное вмешательство, а не случайный клик.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (manualStatus) operatorSetStatus(deal.id, manualStatus)
                  }}
                >
                  Сменить статус
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  )
}
