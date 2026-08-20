import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDeal, useDealHistory, useDemoActions, useDemoState } from '../store/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'
import { RevisionDiffList } from '../components/RevisionDiffList'
import { TransactionList } from '../components/TransactionList'
import { DisputePanel } from '../components/DisputePanel'
import { OrderSpecSummary } from '../components/OrderSpecSummary'
import { AttachmentGallery } from '../components/AttachmentGallery'
import { SignDocumentDialog } from '../components/SignDocumentDialog'
import { PayoutRequisitesDialog } from '../components/PayoutRequisitesDialog'
import { GuaranteeBanner } from '../components/GuaranteeBanner'
import { CancelDealDialog } from '../components/CancelDealDialog'
import { ContractPreviewDialog } from '../components/ContractPreviewDialog'
import { StepGuidanceCard } from '../components/StepGuidanceCard'
import { DealProgressBar } from '../components/DealProgressBar'
import { DealBalance } from '../components/DealBalance'
import { MilestoneList } from '../components/MilestoneList'
import { DealSpecForm } from '../components/DealSpecForm'
import { BackLink } from '../components/BackLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dealToSpecInput } from '../domain/dealMachine'
import { generateActText, generateContractText } from '../domain/contractTemplate'
import { calculateGuaranteeReserve, dealRiskAmount, fitsInReserve } from '../domain/guaranteeReserve'
import { DEAL_AMOUNT_LIMIT, exceedsDealAmountLimit } from '../domain/dealLimits'
import { formatDate, formatMoney } from '../domain/statusLabels'
import { Money } from '../components/Money'

export function FurnitureMakerDealDetail() {
  const { id } = useParams<{ id: string }>()
  const deal = useDeal(id)
  const { revisions, transactions, disputes, attachments, transferRequests, milestones } = useDealHistory(id)
  const { payoutRequisites, deals, transactions: allTransactions } = useDemoState()
  const {
    sendToClient,
    signByFurnitureMaker,
    markProductionDone,
    signActByFurnitureMaker,
    requireApproval,
    setRole,
    updateDeal,
  } = useDemoActions()
  const navigate = useNavigate()
  const [showEditSpecForm, setShowEditSpecForm] = useState(false)
  const [reserveWarning, setReserveWarning] = useState<string | null>(null)

  if (!deal) return <p className="text-sm text-muted-foreground">Сделка не найдена.</p>

  const clientLink = `${window.location.origin}/client/deal/${deal.id}`
  // Резерв гарантии актуален только пока сделка не отправлена — не считаем его на каждый
  // рендер для сделок в остальных статусах.
  const missingRequisites = deal.status === 'draft' && !payoutRequisites
  // Проверка резерва идёт ДО отправки: помещается ли риск этой сделки в остаток покрытия
  // (FR-38). Реактивная проверка «остаток уже исчерпан» пропускала бы сделку, пока по ней
  // нет выплат, и резерв пробивался бы позже — в момент, когда отказать уже нельзя.
  const reserveExceeded =
    deal.status === 'draft' &&
    !fitsInReserve(
      Object.values(deals).filter((d) => d.id !== deal.id),
      allTransactions,
      deal.amount,
      deal.prepaymentPercent + deal.interimPercent,
    )
  const reserveShortfall =
    deal.status === 'draft'
      ? dealRiskAmount(deal) -
        calculateGuaranteeReserve(
          Object.values(deals).filter((d) => d.id !== deal.id),
          allTransactions,
        ).available
      : 0
  // FR-36: сумма сверх лимита не запрещена, а требует одобрения оператора (FR-44). Отправку
  // не блокируем — sendToClient сам направит такую сделку не клиенту, а на одобрение.
  // Предупреждение показываем заранее, чтобы это не было сюрпризом.
  const overDealLimit = deal.status === 'draft' && exceedsDealAmountLimit(deal.amount)
  const sendBlocked = missingRequisites || reserveExceeded
  // Последовательные шаги вместо стопки баннеров разом — на draft показываем ровно одно
  // следующее требование за раз, в этом порядке приоритета.
  const nextRequirement: 'requisites' | 'reserve' | 'approval' | null = missingRequisites
    ? 'requisites'
    : reserveExceeded
      ? 'reserve'
      : overDealLimit
        ? 'approval'
        : null
  // Зона D (Коммуникация) теперь показывает только открытый спор — DisputePanel сам
  // скрывается вне dispute_open, отдельного условия видимости зоны не нужно.
  const hasZoneD = deal.status === 'dispute_open'

  return (
    <div className="grid gap-6">
      <BackLink to="/furniture-maker" label="Мои сделки" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{deal.title}</h1>
          <div className="text-sm text-muted-foreground"><Money amount={deal.amount} /></div>
        </div>
        <StatusBadge status={deal.status} />
      </div>

      {/* Зона A — статус и следующий шаг: единственная гарантированно видна без скролла на
          мобильном, поэтому выделена визуально сильнее остальных зон. */}
      <section className="grid gap-4 rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-4 sm:p-5">
      <DealProgressBar status={deal.status} />

      <StepGuidanceCard status={deal.status} actor="furniture_maker" />

      {deal.status === 'draft' && (
        <div className="grid gap-3">
          <p className="text-sm">Условия заполнены. Отправьте ссылку клиенту, чтобы начать согласование.</p>

          {nextRequirement === 'requisites' && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
              <span>Прежде чем отправить сделку клиенту, укажите реквизиты для выплат.</span>
              <PayoutRequisitesDialog triggerLabel="Добавить реквизиты" />
            </div>
          )}
          {nextRequirement === 'reserve' && (
            <p className="text-sm text-warning">
              Не хватает покрытия гарантии: этой сделке нужно {formatMoney(dealRiskAmount(deal))}, а
              свободно меньше на {formatMoney(Math.max(0, reserveShortfall))}. Отправка станет доступна,
              когда завершатся идущие сделки.
            </p>
          )}
          {nextRequirement === 'approval' && (
            <p className="text-sm text-warning">
              Сумма сделки выше {formatMoney(DEAL_AMOUNT_LIMIT)} — при отправке она уйдёт на одобрение
              оператора, а не сразу клиенту.
            </p>
          )}
          {deal.approvalRejectReason && (
            <p className="text-sm text-destructive">
              Оператор отклонил отправку: «{deal.approvalRejectReason}»
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button disabled={sendBlocked} onClick={() => sendToClient(deal.id)}>
              Отправить клиенту
            </Button>
            <Button variant="outline" onClick={() => navigate(`/furniture-maker/deal/${deal.id}/edit`)}>
              Редактировать
            </Button>
            <ContractPreviewDialog deal={deal} />
            <CancelDealDialog dealId={deal.id} actor="furniture_maker" triggerLabel="Закрыть без подписания" />
          </div>
        </div>
      )}

      {deal.status === 'pending_approval' && (
        <div className="grid gap-3">
          <p className="text-sm">
            Сделка отправлена на одобрение оператора: её сумма выше лимита, при котором отправка
            идёт напрямую клиенту. Как только оператор одобрит, ссылка уйдёт клиенту автоматически.
          </p>
          <CancelDealDialog dealId={deal.id} actor="furniture_maker" triggerLabel="Закрыть без подписания" />
        </div>
      )}

      {deal.status === 'awaiting_client' && (
        <div className="grid gap-3">
          <p className="text-sm">
            Ссылка сгенерирована. Отправьте её клиенту в мессенджер — как только он перейдёт по ней
            и укажет телефон, сделка перейдёт к согласованию.
          </p>
          <LinkCopyBox link={clientLink} dealTitle={deal.title} />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRole('client')
                navigate(`/client/deal/${deal.id}`)
              }}
            >
              Открыть как клиент (для демонстрации)
            </Button>
            <CancelDealDialog dealId={deal.id} actor="furniture_maker" triggerLabel="Закрыть без подписания" />
          </div>
        </div>
      )}

      {deal.status === 'negotiation' && (
        <div className="grid gap-4">
          <section>
            <h2 className="mb-2 text-sm font-semibold">История правок</h2>
            <RevisionDiffList revisions={revisions} />
          </section>
          <section className="grid gap-2">
            <Button variant="outline" className="w-fit" onClick={() => setShowEditSpecForm((v) => !v)}>
              {showEditSpecForm ? 'Скрыть форму условий' : 'Изменить условия по правкам клиента'}
            </Button>
            {reserveWarning && <p className="text-sm text-warning">{reserveWarning}</p>}
            {showEditSpecForm && (
              <DealSpecForm
                key={deal.id}
                initial={dealToSpecInput(deal)}
                submitLabel="Отправить обновлённые условия клиенту"
                onSubmit={(input) => {
                  setReserveWarning(null)
                  updateDeal(deal.id, input)
                  setShowEditSpecForm(false)
                  // FR-52: сделка, отправленная в пределах лимита, может дорасти через торг выше
                  // него. Правку сохраняем — запрещать её нельзя, это нормальный ход торга, — но
                  // сделка уходит на одобрение оператора, а не остаётся в согласовании без проверки.
                  if (exceedsDealAmountLimit(input.amount)) {
                    requireApproval(deal.id)
                  }
                }}
              />
            )}
          </section>
          {deal.clientAccepted ? (
            <SignDocumentDialog
              documentTitle={`Договор подряда № ${deal.slug}`}
              documentText={generateContractText(deal)}
              triggerLabel="Посмотреть и подписать договор"
              onSign={(code) => signByFurnitureMaker(deal.id, code)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Ожидаем решения клиента — согласия или правок.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRole('client')
                navigate(`/client/deal/${deal.id}`)
              }}
            >
              Открыть как клиент (для демонстрации)
            </Button>
            <CancelDealDialog dealId={deal.id} actor="furniture_maker" triggerLabel="Отменить сделку" />
          </div>
        </div>
      )}

      {deal.status === 'contract_signing' && (
        <div className="grid gap-3">
          <div className="rounded-md border border-info/30 bg-info/10 px-3.5 py-2.5 text-sm text-info">
            Вы подписали договор. Ожидаем подписания от клиента — это может занять время, клиент подпишет,
            когда откроет ссылку.
          </div>
          <div className="flex flex-wrap gap-2">
            <CancelDealDialog dealId={deal.id} actor="furniture_maker" triggerLabel="Отменить сделку" />
          </div>
        </div>
      )}

      {(deal.status === 'contract_signed' || deal.status === 'payment_pending') && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Договор подписан обеими сторонами, ждём оплату от клиента.</p>
          <GuaranteeBanner perspective="furniture_maker" issuedAt={deal.guaranteeIssuedAt} />
          <div className="flex flex-wrap gap-2">
            <CancelDealDialog dealId={deal.id} actor="furniture_maker" triggerLabel="Отменить сделку" />
          </div>
        </div>
      )}

      {deal.status === 'payment_processing' && (
        <p className="text-sm text-muted-foreground">Клиент оплачивает — платёж обрабатывается банком/эквайрингом.</p>
      )}

      {deal.status === 'remedy' && (
        <div className="grid gap-3">
          <div className="border border-warning/40 bg-wait-soft px-4 py-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-warning">
              Срок устранения
            </div>
            <p className="mt-1 text-sm">
              По решению спора недостатки нужно устранить{' '}
              <span className="font-semibold">
                до {deal.remedyDeadline ? formatDate(deal.remedyDeadline) : 'срока, назначенного арбитром'}
              </span>
              . После этого заявите готовность повторно — у клиента снова будет 3 рабочих дня на приёмку.
            </p>
          </div>
          <Button className="w-fit" onClick={() => markProductionDone(deal.id)}>
            Отметить готово / передать на приёмку
          </Button>
        </div>
      )}

      {(deal.status === 'paid' || deal.status === 'in_production') && (
        <div className="grid gap-3">
          <p className="text-sm">Оплата получена, изделие в производстве.</p>
          {deal.status === 'in_production' && deal.actRejectionReason && (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
              Клиент отклонил приёмку: «{deal.actRejectionReason}»
            </div>
          )}
          {/* Кнопка «Запросить доступность транша» убрана вместе с payInterim: промежуточные
              деньги теперь раскрывает подтверждение соответствующего этапа (FR-14). Оставить
              оба пути значило бы выплатить один и тот же транш дважды. */}
          <Button className="w-fit" onClick={() => markProductionDone(deal.id)}>
            Отметить готово / передать на приёмку
          </Button>
        </div>
      )}

      {deal.status === 'awaiting_acceptance' && (
        <SignDocumentDialog
          documentTitle={`Акт приёма-передачи к договору № ${deal.slug}`}
          documentText={generateActText(deal)}
          triggerLabel="Посмотреть и подписать акт"
          onSign={(code) => signActByFurnitureMaker(deal.id, code)}
        />
      )}

      {deal.status === 'act_signing' && (
        <div className="rounded-md border border-info/30 bg-info/10 px-3.5 py-2.5 text-sm text-info">
          Вы подписали акт. Ожидаем подписания от клиента — после этого придёт финальный платёж.
        </div>
      )}

      {deal.status === 'completed' && (
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-success">
            Сделка завершена. Итоговая сумма зачислена на счёт платформы — доступна к запросу перевода (см.
            «Выплаты» ниже).
          </p>
          {deal.acceptedWithRemarks && (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
              Клиент принял с замечаниями: «{deal.acceptanceRemarks}»
            </div>
          )}
        </div>
      )}

      {deal.status === 'cancelled_refunded' && (
        <p className="text-sm font-semibold text-destructive">Сделка отменена, инициирован возврат клиенту.</p>
      )}

      {deal.status === 'cancelled' && (
        <p className="text-sm font-semibold text-muted-foreground">
          Сделка отменена{deal.cancellationReason && `: «${deal.cancellationReason}»`}.
        </p>
      )}
      </section>

      {/* Зона B — заказ. Характеристики заказа показываем один раз, сразу после создания
          сделки (draft) — на последующих статусах они не дублируются на каждом шаге. */}
      {deal.status === 'draft' && (
        <section className="grid gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Заказ</h2>
          <OrderSpecSummary deal={deal} />
        </section>
      )}

      {attachments.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Референсы от клиента</h3>
          <AttachmentGallery attachments={attachments} />
        </section>
      )}

      {/* Этапы — ключевой ответ на вопрос «когда придут деньги»: транш раскрывается только
          после подтверждения этапа оператором, поэтому список стоит выше блока денег. */}
      <MilestoneList deal={deal} milestones={milestones} role="furniture_maker" />

      {/* Зона C — деньги. Отдельного таймлайна выплат здесь нет сознательно: график
          раскрытия денег показывает список этапов выше, и второе его описание расходилось
          с моделью — обещало предоплату «после подписания договора», хотя деньги
          раскрывает подтверждение этапа оператором (FR-14). */}
      {transactions.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Деньги</h2>
          <DealBalance
            dealId={deal.id}
            dealAmount={deal.amount}
            transactions={transactions}
            transferRequests={transferRequests}
            payoutRequisites={payoutRequisites}
          />
          <TransactionList transactions={transactions} />
        </section>
      )}

      {/* Зона D — открытый спор (если есть). Переписка временно скрыта на этом этапе пилота —
          стороны общаются вне платформы, см. PRD раздел 21. Компонент и данные messages не
          удалены, чтобы вернуть в одну строку. */}
      {hasZoneD && (
        <section className="grid gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Коммуникация</h2>
          <DisputePanel deal={deal} disputes={disputes} />
        </section>
      )}
    </div>
  )
}

function LinkCopyBox({ link, dealTitle }: { link: string; dealTitle: string }) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <Input readOnly value={link} className="text-muted-foreground" />
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard
              .writeText(link)
              .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
              .catch(() => setCopyFailed(true))
          }}
        >
          {copied ? 'Скопировано' : 'Скопировать'}
        </Button>
        {canShare && (
          <Button
            onClick={() => {
              navigator
                .share({
                  title: 'Безопасная сделка',
                  text: `Условия сделки «${dealTitle}» на платформе Asia Mebel`,
                  url: link,
                })
                .catch(() => {})
            }}
          >
            Поделиться
          </Button>
        )}
      </div>
      {copyFailed && (
        <span className="text-xs text-destructive">Не удалось скопировать — выделите ссылку вручную</span>
      )}
    </div>
  )
}
