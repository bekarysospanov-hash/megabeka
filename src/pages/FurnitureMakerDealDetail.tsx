import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDeal, useDealHistory, useDemoActions, useDemoState } from '../store/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'
import { RevisionDiffList } from '../components/RevisionDiffList'
import { TransactionList } from '../components/TransactionList'
import { DisputePanel } from '../components/DisputePanel'
import { DemoModeBanner } from '../components/DemoModeBanner'
import { OrderSpecSummary } from '../components/OrderSpecSummary'
import { AttachmentGallery } from '../components/AttachmentGallery'
import { SignDocumentDialog } from '../components/SignDocumentDialog'
import { PayoutRequisitesDialog } from '../components/PayoutRequisitesDialog'
import { GuaranteeBanner } from '../components/GuaranteeBanner'
import { GuaranteeCertificateDialog, hasSeenCertificate } from '../components/GuaranteeCertificateDialog'
import { CancelDealDialog } from '../components/CancelDealDialog'
import { StepGuidanceCard } from '../components/StepGuidanceCard'
import { DealProgressBar } from '../components/DealProgressBar'
import { DealBalance } from '../components/DealBalance'
import { PayoutTimeline } from '../components/PayoutTimeline'
import { DealSpecForm } from '../components/DealSpecForm'
import { BackLink } from '../components/BackLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CANCELLABLE_STATUSES, dealToSpecInput, ESCALATABLE_STATUSES } from '../domain/dealMachine'
import { generateActText, generateContractText } from '../domain/contractTemplate'
import { calculateGuaranteeReserve, GUARANTEE_RESERVE_LIMIT } from '../domain/guaranteeReserve'
import { formatMoney } from '../domain/statusLabels'

const ESCALATABLE = new Set(ESCALATABLE_STATUSES)
const CANCELLABLE = new Set(CANCELLABLE_STATUSES)

export function FurnitureMakerDealDetail() {
  const { id } = useParams<{ id: string }>()
  const deal = useDeal(id)
  const { revisions, transactions, disputes, attachments, transferRequests } = useDealHistory(id)
  const { payoutRequisites, deals, furnitureMakerVerification } = useDemoState()
  const {
    sendToClient,
    signByFurnitureMaker,
    markProductionDone,
    signActByFurnitureMaker,
    callOperator,
    setRole,
    updateDeal,
  } = useDemoActions()
  const navigate = useNavigate()
  const [operatorReason, setOperatorReason] = useState('')
  const [showEditSpecForm, setShowEditSpecForm] = useState(false)
  const [reserveWarning, setReserveWarning] = useState<string | null>(null)
  const [certificateSeen, setCertificateSeen] = useState(() => (deal ? hasSeenCertificate(deal.id) : true))

  useEffect(() => {
    if (deal) setCertificateSeen(hasSeenCertificate(deal.id))
  }, [deal?.id])

  if (!deal) return <p className="text-sm text-muted-foreground">Сделка не найдена.</p>

  const clientLink = `${window.location.origin}/client/deal/${deal.id}`
  // Резерв гарантии актуален только пока сделка не отправлена — не считаем его на каждый
  // рендер для сделок в остальных статусах.
  const missingRequisites = deal.status === 'draft' && !payoutRequisites
  const missingVerification = deal.status === 'draft' && !furnitureMakerVerification
  const availableReserve =
    deal.status === 'draft' ? calculateGuaranteeReserve(Object.values(deals)).available : 0
  const reserveShortfall = deal.amount - availableReserve
  const reserveExceeded = deal.status === 'draft' && reserveShortfall > 0
  const sendBlocked = missingRequisites || missingVerification || reserveExceeded
  // Последовательные шаги вместо стопки баннеров разом — на draft показываем ровно одно
  // следующее требование за раз, в этом порядке приоритета.
  const nextRequirement: 'requisites' | 'verification' | 'reserve' | null = missingRequisites
    ? 'requisites'
    : missingVerification
      ? 'verification'
      : reserveExceeded
        ? 'reserve'
        : null
  // Зона D (Коммуникация) не рендерится вовсе, если её содержимое целиком скрыто условиями
  // ниже — иначе на draft/awaiting_client показывался бы пустой заголовок зоны без контента.
  // CANCELLABLE/ESCALATABLE — подмножества "не draft и не awaiting_client", отдельно их
  // проверять не нужно (свернулось бы к тому же самому, только менее явно).
  const hasZoneD = deal.status !== 'draft' && deal.status !== 'awaiting_client'

  return (
    <div className="grid gap-6">
      <BackLink to="/furniture-maker" label="Мои сделки" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{deal.title}</h1>
          <div className="text-sm text-muted-foreground">{formatMoney(deal.amount)}</div>
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
          {nextRequirement === 'verification' && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
              <span>Прежде чем отправить сделку клиенту, пройдите верификацию.</span>
              <Button asChild variant="outline" size="sm">
                <Link to="/furniture-maker/verification">Пройти верификацию</Link>
              </Button>
            </div>
          )}
          {nextRequirement === 'reserve' && (
            <p className="text-sm text-warning">
              Резерв гарантии исчерпан: не хватает {formatMoney(reserveShortfall)}. Дождитесь освобождения
              резерва по другим сделкам.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button disabled={sendBlocked} onClick={() => sendToClient(deal.id)}>
              Отправить клиенту
            </Button>
            <Button variant="outline" onClick={() => navigate(`/furniture-maker/deal/${deal.id}/edit`)}>
              Редактировать
            </Button>
          </div>
        </div>
      )}

      {deal.status === 'awaiting_client' && (
        <div className="grid gap-3">
          <p className="text-sm">
            Ссылка сгенерирована. Отправьте её клиенту в мессенджер — как только он перейдёт по ней
            и укажет телефон, сделка перейдёт к согласованию.
          </p>
          <LinkCopyBox link={clientLink} dealTitle={deal.title} />
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => {
              setRole('client')
              navigate(`/client/deal/${deal.id}`)
            }}
          >
            Открыть как клиент (для демонстрации)
          </Button>
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
                  const otherReserveUsed = calculateGuaranteeReserve(
                    Object.values(deals).filter((d) => d.id !== deal.id),
                  ).used
                  const availableForThisDeal = GUARANTEE_RESERVE_LIMIT - otherReserveUsed
                  if (input.amount > availableForThisDeal) {
                    setReserveWarning(
                      `Новая сумма превышает доступный резерв гарантии — не хватает ${formatMoney(input.amount - availableForThisDeal)}.`,
                    )
                    return
                  }
                  setReserveWarning(null)
                  updateDeal(deal.id, input)
                  setShowEditSpecForm(false)
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
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => {
              setRole('client')
              navigate(`/client/deal/${deal.id}`)
            }}
          >
            Открыть как клиент (для демонстрации)
          </Button>
        </div>
      )}

      {deal.status === 'contract_signing' && (
        <div className="rounded-md border border-info/30 bg-info/10 px-3.5 py-2.5 text-sm text-info">
          Вы подписали договор. Ожидаем подписания от клиента — это может занять время, клиент подпишет,
          когда откроет ссылку.
        </div>
      )}

      {(deal.status === 'contract_signed' || deal.status === 'payment_pending') && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Договор подписан обеими сторонами, ждём оплату от клиента.</p>
          <GuaranteeBanner perspective="furniture_maker" />
        </div>
      )}

      {deal.status === 'payment_processing' && (
        <p className="text-sm text-muted-foreground">Клиент оплачивает — платёж обрабатывается банком/эквайрингом.</p>
      )}

      {(deal.status === 'paid' || deal.status === 'in_production') && (
        <div className="grid gap-3">
          <p className="text-sm">Оплата получена, изделие в производстве.</p>
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

      {/* Зона B — заказ */}
      <section className="grid gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Заказ</h2>

        {deal.status === 'draft' && !certificateSeen && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-info/30 bg-info/10 px-3.5 py-2.5 text-sm text-info">
            <span>По этой сделке оформлена гарантия Asia Mebel.</span>
          </div>
        )}

        <div className="flex justify-end">
          <GuaranteeCertificateDialog deal={deal} onOpen={() => setCertificateSeen(true)} />
        </div>

        <OrderSpecSummary deal={deal} />

        {attachments.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">Референсы от клиента</h3>
            <AttachmentGallery attachments={attachments} />
          </section>
        )}
      </section>

      {/* Зона C — деньги */}
      {transactions.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Деньги</h2>
          <PayoutTimeline deal={deal} transactions={transactions} />
          <DealBalance
            dealId={deal.id}
            transactions={transactions}
            transferRequests={transferRequests}
            payoutRequisites={payoutRequisites}
          />
          <TransactionList transactions={transactions} />
        </section>
      )}

      {/* Зона D — коммуникация и выход из сделки */}
      {hasZoneD && (
        <section className="grid gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Коммуникация</h2>

          <DisputePanel deal={deal} disputes={disputes} />

          {CANCELLABLE.has(deal.status) && (
            <div className="flex justify-end">
              <CancelDealDialog dealId={deal.id} actor="furniture_maker" triggerLabel="Не могу выполнить заказ" />
            </div>
          )}

          {/* Переписка временно скрыта на этом этапе пилота — стороны общаются вне платформы,
              см. PRD раздел 21. Компонент и данные messages не удалены, чтобы вернуть в одну строку. */}

          {ESCALATABLE.has(deal.status) && (
            <section className="grid gap-2">
              <h3 className="text-sm font-semibold">Позвать оператора</h3>
              <DemoModeBanner>Оператор реально не уведомляется — это демонстрация вмешательства.</DemoModeBanner>
              <Textarea
                value={operatorReason}
                onChange={(e) => setOperatorReason(e.target.value)}
                placeholder="Опишите проблему, например: клиент не выходит на связь"
              />
              <Button
                variant="outline"
                className="w-fit"
                disabled={!operatorReason.trim()}
                onClick={() => {
                  callOperator(deal.id, 'furniture_maker', operatorReason.trim())
                  setOperatorReason('')
                }}
              >
                Сообщить о проблеме
              </Button>
            </section>
          )}
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
