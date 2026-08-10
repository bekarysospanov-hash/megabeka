import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDeal, useDealHistory, useDemoActions, useDemoState } from '../store/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'
import { RevisionDiffList } from '../components/RevisionDiffList'
import { TransactionList } from '../components/TransactionList'
import { DisputePanel } from '../components/DisputePanel'
import { MessageThread } from '../components/MessageThread'
import { DemoModeBanner } from '../components/DemoModeBanner'
import { OrderSpecSummary } from '../components/OrderSpecSummary'
import { AttachmentGallery } from '../components/AttachmentGallery'
import { SignDocumentDialog } from '../components/SignDocumentDialog'
import { PayoutRequisitesDialog } from '../components/PayoutRequisitesDialog'
import { GuaranteeBanner } from '../components/GuaranteeBanner'
import { GuaranteeCertificateDialog } from '../components/GuaranteeCertificateDialog'
import { StepGuidanceCard } from '../components/StepGuidanceCard'
import { DealProgressBar } from '../components/DealProgressBar'
import { DealBalance } from '../components/DealBalance'
import { PayoutTimeline } from '../components/PayoutTimeline'
import { DealSpecForm } from '../components/DealSpecForm'
import { BackLink } from '../components/BackLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { dealToSpecInput, ESCALATABLE_STATUSES } from '../domain/dealMachine'
import { generateActText, generateContractText } from '../domain/contractTemplate'
import { calculateGuaranteeReserve, GUARANTEE_RESERVE_LIMIT } from '../domain/guaranteeReserve'
import { formatMoney } from '../domain/statusLabels'

const ESCALATABLE = new Set(ESCALATABLE_STATUSES)

export function FurnitureMakerDealDetail() {
  const { id } = useParams<{ id: string }>()
  const deal = useDeal(id)
  const { revisions, transactions, disputes, messages, attachments, transferRequests } = useDealHistory(id)
  const { payoutRequisites, deals, furnitureMakerVerification } = useDemoState()
  const {
    sendToClient,
    signByFurnitureMaker,
    markProductionDone,
    signActByFurnitureMaker,
    callOperator,
    setRole,
    updateDeal,
    addMessage,
  } = useDemoActions()
  const navigate = useNavigate()
  const [operatorReason, setOperatorReason] = useState('')
  const [showEditSpecForm, setShowEditSpecForm] = useState(false)
  const [reserveWarning, setReserveWarning] = useState<string | null>(null)

  if (!deal) return <p className="text-sm text-muted-foreground">Сделка не найдена.</p>

  const clientLink = `${window.location.origin}/client/deal/${deal.id}`
  // Резерв гарантии актуален только пока сделка не отправлена — не считаем его на каждый
  // рендер для сделок в остальных статусах.
  const missingRequisites = deal.status === 'draft' && !payoutRequisites
  const availableReserve =
    deal.status === 'draft' ? calculateGuaranteeReserve(Object.values(deals)).available : 0
  const reserveShortfall = deal.amount - availableReserve
  const reserveExceeded = deal.status === 'draft' && reserveShortfall > 0
  const sendBlocked = missingRequisites || reserveExceeded

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

      <DealProgressBar status={deal.status} />

      <StepGuidanceCard status={deal.status} actor="furniture_maker" />

      <div className="flex justify-end">
        <GuaranteeCertificateDialog deal={deal} />
      </div>

      <OrderSpecSummary deal={deal} />

      {attachments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Референсы от клиента</h2>
          <AttachmentGallery attachments={attachments} />
        </section>
      )}

      {deal.status === 'draft' && (
        <div className="grid gap-3">
          <p className="text-sm">Условия заполнены. Отправьте ссылку клиенту, чтобы начать согласование.</p>
          {missingRequisites && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
              <span>Прежде чем отправить сделку клиенту, укажите реквизиты для выплат.</span>
              <PayoutRequisitesDialog triggerLabel="Добавить реквизиты" />
            </div>
          )}
          {!furnitureMakerVerification && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-info/30 bg-info/10 px-3.5 py-2.5 text-sm text-info">
              <span>Вы ещё не прошли верификацию — клиенты увидят, что вы проверенный продавец.</span>
              <Button asChild variant="outline" size="sm">
                <Link to="/furniture-maker/verification">Пройти верификацию</Link>
              </Button>
            </div>
          )}
          {reserveExceeded && (
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
          <p className="text-sm font-semibold text-success">Сделка завершена, выплаты произведены.</p>
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

      <DisputePanel deal={deal} disputes={disputes} />

      {deal.status !== 'draft' && deal.status !== 'awaiting_client' && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Переписка</h2>
          <MessageThread messages={messages} onSend={(text) => addMessage(deal.id, 'furniture_maker', text)} />
        </section>
      )}

      {transactions.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold">Выплаты</h2>
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

      {ESCALATABLE.has(deal.status) && (
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold">Позвать оператора</h2>
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
