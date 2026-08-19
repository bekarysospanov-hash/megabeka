import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDeal, useDealHistory, useDemoActions } from '../store/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'
import { RevisionDiffList } from '../components/RevisionDiffList'
import { DisputePanel } from '../components/DisputePanel'
import { DemoModeBanner } from '../components/DemoModeBanner'
import { PreliminaryEstimateBanner } from '../components/PreliminaryEstimateBanner'
import { AttachmentGallery } from '../components/AttachmentGallery'
import { SignDocumentDialog } from '../components/SignDocumentDialog'
import { PaymentMethodPicker, PaymentProcessing } from '../components/PaymentFlow'
import { GuaranteeBanner } from '../components/GuaranteeBanner'
import { StepGuidanceCard } from '../components/StepGuidanceCard'
import { DealProgressBar } from '../components/DealProgressBar'
import { DealMoneyBoard } from '../components/DealMoneyBoard'
import { AcceptanceDeadline } from '../components/AcceptanceDeadline'
import { OfferAgreementNote } from '../components/OfferAgreementNote'
import { ProductionTimer } from '../components/ProductionTimer'
import { RevisionRequestForm } from '../components/RevisionRequestForm'
import { CancelDealDialog } from '../components/CancelDealDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { generateActText, generateContractText } from '../domain/contractTemplate'
import { formatDateTime, formatMoney } from '../domain/statusLabels'
import type { Deal } from '../domain/types'
import { Money } from '../components/Money'

export function ClientDealEntry() {
  const { id } = useParams<{ id: string }>()
  const deal = useDeal(id)

  if (!deal) return <p className="text-sm text-muted-foreground">Сделка не найдена — проверьте ссылку.</p>
  if (deal.status === 'draft') {
    return (
      <p className="text-sm text-muted-foreground">
        Мебельщик ещё готовит условия сделки. Попробуйте перейти по ссылке позже.
      </p>
    )
  }
  if (deal.status === 'awaiting_client' && !deal.clientPhone) {
    return <ClientOnboarding deal={deal} />
  }

  return <ClientDealScreen dealId={deal.id} />
}

function ClientOnboarding({ deal }: { deal: Deal }) {
  const { onboardClient } = useDemoActions()
  const knownContact = Boolean(deal.contactName || deal.contactPhone)
  const [editing, setEditing] = useState(!knownContact)
  const [name, setName] = useState(deal.contactName ?? '')
  const [phone, setPhone] = useState(deal.contactPhone ?? '')

  if (knownContact && !editing) {
    return (
      <div className="grid gap-5">
        <h1 className="text-xl font-semibold tracking-tight">Вас пригласили в сделку</h1>
        <p className="text-sm text-muted-foreground">
          Мебельщик предлагает сделку «{deal.title}» на сумму {formatMoney(deal.amount)}.
        </p>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Это вы?</div>
          <div className="mt-1 font-semibold">{deal.contactName || 'Имя не указано'}</div>
          <div className="text-sm text-muted-foreground">{deal.contactPhone || 'Телефон не указан'}</div>
        </div>
        <GuaranteeBanner perspective="client" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onboardClient(deal.id, name.trim(), phone.trim())}>Да, это я</Button>
          <Button variant="outline" onClick={() => setEditing(true)}>
            Указать другие данные
          </Button>
        </div>
        <OfferAgreementNote />
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <h1 className="text-xl font-semibold tracking-tight">Вас пригласили в сделку</h1>
      <p className="text-sm text-muted-foreground">
        Мебельщик предлагает сделку «{deal.title}» на сумму {formatMoney(deal.amount)}. Укажите имя и
        номер телефона, чтобы открыть личный кабинет и посмотреть условия.
      </p>
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="client-name">Имя</Label>
          <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="client-phone">Телефон</Label>
          <Input
            id="client-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 700 000 00 00"
          />
        </div>
      </div>
      <GuaranteeBanner perspective="client" />
      <Button
        disabled={name.trim().length < 2 || phone.trim().length < 5}
        onClick={() => onboardClient(deal.id, name.trim(), phone.trim())}
      >
        Продолжить
      </Button>
      <OfferAgreementNote />
    </div>
  )
}

function ClientDealScreen({ dealId }: { dealId: string }) {
  const deal = useDeal(dealId)!
  const { revisions, disputes, attachments, transactions } = useDealHistory(dealId)
  const {
    clientAccepts,
    requestRevisions,
    signByClientSms,
    submitPayment,
    pay,
    retryPayment,
    signAct,
    rejectAct,
    autoAcceptDeal,
    addAttachment,
  } = useDemoActions()

  const finalAmount = Math.round((deal.amount * deal.finalPercent) / 100)
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [acceptanceRemarks, setAcceptanceRemarks] = useState('')

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{deal.title}</h1>
          <div className="text-sm text-muted-foreground"><Money amount={deal.amount} /></div>
        </div>
        <StatusBadge status={deal.status} />
      </div>

      <DealProgressBar status={deal.status} />

      {/* Блок «Деньги» стоит выше блока «Сейчас» сознательно (дизайн-спека, раздел 4):
          первый вопрос клиента — про деньги, а не про процесс. */}
      <DealMoneyBoard deal={deal} transactions={transactions} />

      <StepGuidanceCard status={deal.status} actor="client" />

      {deal.status === 'negotiation' && <PreliminaryEstimateBanner />}

      {deal.status === 'negotiation' && !deal.clientAccepted && (
        <div className="grid gap-4">
          <section>
            <h2 className="mb-2 text-sm font-semibold">История правок</h2>
            <RevisionDiffList revisions={revisions} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Референсы</h2>
            <p className="mb-2 text-xs text-muted-foreground">
              Фото с Pinterest или похожего интерьера — поможет мебельщику понять, что вы хотите.
            </p>
            <AttachmentGallery
              attachments={attachments}
              onUpload={(dataUrl) => addAttachment(deal.id, dataUrl, 'client')}
            />
          </section>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => clientAccepts(deal.id)}>Согласен</Button>
            <Button variant="outline" onClick={() => setShowRevisionForm((v) => !v)}>
              Запросить правки
            </Button>
            <CancelDealDialog dealId={deal.id} actor="client" triggerLabel="Отменить сделку" />
          </div>
          {showRevisionForm && (
            <RevisionRequestForm
              deal={deal}
              onCancel={() => setShowRevisionForm(false)}
              onSubmit={(revisions, comment) => {
                requestRevisions(deal.id, revisions, comment)
                setShowRevisionForm(false)
              }}
            />
          )}
        </div>
      )}

      {deal.status === 'negotiation' && deal.clientAccepted && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Вы приняли условия, ждём подпись мебельщика.</p>
          <div className="flex flex-wrap gap-2">
            <CancelDealDialog dealId={deal.id} actor="client" triggerLabel="Отменить сделку" />
          </div>
        </div>
      )}

      {deal.status === 'contract_signing' && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Мебельщик подписал договор. Посмотрите условия и подпишите со своей стороны.
          </p>
          <div className="flex flex-wrap gap-2">
            <SignDocumentDialog
              documentTitle={`Договор подряда № ${deal.slug}`}
              documentText={generateContractText(deal)}
              triggerLabel="Посмотреть и подписать договор"
              onSign={(code) => signByClientSms(deal.id, code)}
            />
            <CancelDealDialog dealId={deal.id} actor="client" triggerLabel="Отменить сделку" />
          </div>
        </div>
      )}

      {(deal.status === 'contract_signed' || deal.status === 'payment_pending') && (
        <div className="grid gap-3">
          {/* Баннер гарантии убран: обещание возврата теперь живёт в блоке «Деньги» точной
              формулировкой с суммами (FR-08). Общая фраза «мы вернём вам оплату» рядом с ней
              только размывала конкретику, а её иконка-щит запрещена разделом 2 дизайн-спеки. */}
          <DemoModeBanner>Оплата имитируется, реальный платёж не проводится.</DemoModeBanner>
          <PaymentMethodPicker amount={deal.amount} onSubmit={(method) => submitPayment(deal.id, method)} />
          <div className="flex flex-wrap gap-2">
            <CancelDealDialog dealId={deal.id} actor="client" triggerLabel="Отменить сделку" />
          </div>
        </div>
      )}

      {deal.status === 'payment_processing' && (
        <PaymentProcessing
          method={deal.paymentMethod}
          onConfirm={() => pay(deal.id)}
          onRetry={() => retryPayment(deal.id)}
        />
      )}

      {(deal.status === 'paid' || deal.status === 'in_production') && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Оплата получена, мебельщик готовит заказ.</p>
          {deal.status === 'in_production' && <ProductionTimer deal={deal} />}
        </div>
      )}

      {deal.status === 'awaiting_acceptance' && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Мебельщик готовит акт приёма-передачи. Как только он подпишет — вы сможете подписать со своей
            стороны.
          </p>
          <AcceptanceDeadline deal={deal} finalAmount={finalAmount} />
        </div>
      )}

      {deal.status === 'act_signing' && (
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="acceptance-remarks">Комментарий к приёмке (если есть недочёты)</Label>
            <Textarea
              id="acceptance-remarks"
              value={acceptanceRemarks}
              onChange={(e) => setAcceptanceRemarks(e.target.value)}
              placeholder="Например: скол на дверце — необязательно, если недочётов нет"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <SignDocumentDialog
              documentTitle={`Акт приёма-передачи к договору № ${deal.slug}`}
              documentText={generateActText(deal)}
              triggerLabel="Посмотреть и подписать акт"
              onSign={(code) => signAct(deal.id, code, acceptanceRemarks.trim() || null)}
            />
            <Button
              variant="outline"
              disabled={!acceptanceRemarks.trim()}
              onClick={() => rejectAct(deal.id, acceptanceRemarks.trim())}
            >
              Отклонить приёмку
            </Button>
          </div>
          {!acceptanceRemarks.trim() && (
            <p className="text-xs text-muted-foreground">
              Чтобы отклонить приёмку, опишите причину в комментарии выше.
            </p>
          )}
          <AcceptanceDeadline deal={deal} finalAmount={finalAmount} />
          <DemoModeBanner>
            Отсчёт окна приёмки идёт по реальному времени — для показа его можно промотать.
            <button
              type="button"
              className="ml-1 underline underline-offset-2"
              onClick={() => autoAcceptDeal(deal.id)}
            >
              Демо: срок истёк
            </button>
          </DemoModeBanner>
        </div>
      )}

      {deal.status === 'completed' &&
        (deal.autoAcceptedAt ? (
          // FR-22: основание — истечение срока, а не подпись клиента. Показываем это прямо,
          // а не выдаём за приёмку, которой человек не совершал.
          <div className="grid gap-1.5 border border-border bg-card p-4">
            <p className="text-sm font-semibold">Работа принята автоматически</p>
            <p className="text-[13px] text-muted-foreground">
              Вы не подписали акт до {formatDateTime(deal.acceptanceDeadline ?? deal.autoAcceptedAt)}, поэтому
              заказ считается принятым, а оставшаяся часть суммы переведена производителю. Если у вас
              есть претензии к работе, свяжитесь с менеджером.
            </p>
          </div>
        ) : (
          <p className="text-sm font-semibold text-success">Сделка завершена. Спасибо за заказ!</p>
        ))}

      {deal.status === 'cancelled_refunded' && (
        <p className="text-sm font-semibold text-destructive">Сделка отменена, деньги возвращены (демо).</p>
      )}

      {deal.status === 'cancelled' && (
        <p className="text-sm font-semibold text-muted-foreground">
          Сделка отменена{deal.cancellationReason && `: «${deal.cancellationReason}»`}.
        </p>
      )}

      {/* Переписка временно скрыта на этом этапе пилота — стороны общаются вне платформы,
          см. PRD раздел 21. Компонент и данные messages не удалены, чтобы вернуть в одну строку. */}

      <DisputePanel deal={deal} disputes={disputes} />
    </div>
  )
}
