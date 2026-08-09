import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDeal, useDealHistory, useDemoActions } from '../store/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'
import { RevisionDiffList } from '../components/RevisionDiffList'
import { DisputePanel } from '../components/DisputePanel'
import { MessageThread } from '../components/MessageThread'
import { DemoModeBanner } from '../components/DemoModeBanner'
import { OrderSpecSummary } from '../components/OrderSpecSummary'
import { PreliminaryEstimateBanner } from '../components/PreliminaryEstimateBanner'
import { AttachmentGallery } from '../components/AttachmentGallery'
import { SignDocumentDialog } from '../components/SignDocumentDialog'
import { PaymentMethodPicker, PaymentProcessing } from '../components/PaymentFlow'
import { GuaranteeBanner } from '../components/GuaranteeBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ESCALATABLE_STATUSES } from '../domain/dealMachine'
import { generateActText, generateContractText } from '../domain/contractTemplate'
import { formatMoney } from '../domain/statusLabels'
import type { Deal } from '../domain/types'

const ESCALATABLE = new Set(ESCALATABLE_STATUSES)

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
    </div>
  )
}

function ClientDealScreen({ dealId }: { dealId: string }) {
  const deal = useDeal(dealId)!
  const { revisions, disputes, messages, attachments } = useDealHistory(dealId)
  const {
    clientAccepts,
    requestRevision,
    signByClientSms,
    submitPayment,
    pay,
    signAct,
    callOperator,
    addAttachment,
  } = useDemoActions()

  const [revisionField, setRevisionField] = useState<'amount' | 'deadline'>('amount')
  const [revisionNewValue, setRevisionNewValue] = useState('')
  const [revisionComment, setRevisionComment] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [operatorReason, setOperatorReason] = useState('')

  function closeRevisionForm() {
    setShowRevisionForm(false)
    setRevisionNewValue('')
    setRevisionComment('')
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{deal.title}</h1>
          <div className="text-sm text-muted-foreground">{formatMoney(deal.amount)}</div>
        </div>
        <StatusBadge status={deal.status} />
      </div>

      {deal.status === 'negotiation' && <PreliminaryEstimateBanner />}

      <OrderSpecSummary deal={deal} hideContact />

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
          </div>
          {showRevisionForm && (
            <div className="grid gap-3 rounded-lg border p-4">
              <Select value={revisionField} onValueChange={(v) => setRevisionField(v as 'amount' | 'deadline')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Сумма</SelectItem>
                  <SelectItem value="deadline">Срок изготовления</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={revisionNewValue}
                onChange={(e) => setRevisionNewValue(e.target.value)}
                placeholder="Новое значение"
              />
              <Input
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                placeholder="Комментарий (необязательно)"
              />
              <div className="flex gap-2">
                <Button
                  disabled={!revisionNewValue.trim()}
                  onClick={() => {
                    requestRevision(
                      deal.id,
                      revisionField,
                      revisionField === 'amount' ? String(deal.amount) : '—',
                      revisionNewValue.trim(),
                      revisionComment.trim(),
                    )
                    closeRevisionForm()
                  }}
                >
                  Отправить правку
                </Button>
                <Button variant="ghost" onClick={closeRevisionForm}>
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {deal.status === 'negotiation' && deal.clientAccepted && (
        <p className="text-sm text-muted-foreground">Вы приняли условия, ждём подпись мебельщика.</p>
      )}

      {deal.status === 'contract_signing' && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Мебельщик подписал договор. Посмотрите условия и подпишите со своей стороны.
          </p>
          <SignDocumentDialog
            documentTitle={`Договор подряда № ${deal.slug}`}
            documentText={generateContractText(deal)}
            triggerLabel="Посмотреть и подписать договор"
            onSign={(code) => signByClientSms(deal.id, code)}
          />
        </div>
      )}

      {(deal.status === 'contract_signed' || deal.status === 'payment_pending') && (
        <div className="grid gap-3">
          <GuaranteeBanner perspective="client" />
          <DemoModeBanner>Оплата имитируется, реальный платёж не проводится.</DemoModeBanner>
          <PaymentMethodPicker amount={deal.amount} onSubmit={(method) => submitPayment(deal.id, method)} />
        </div>
      )}

      {deal.status === 'payment_processing' && (
        <PaymentProcessing method={deal.paymentMethod} onConfirm={() => pay(deal.id)} />
      )}

      {(deal.status === 'paid' || deal.status === 'in_production') && (
        <p className="text-sm text-muted-foreground">Оплата получена, мебельщик готовит заказ.</p>
      )}

      {deal.status === 'awaiting_acceptance' && (
        <p className="text-sm text-muted-foreground">
          Мебельщик готовит акт приёма-передачи. Как только он подпишет — вы сможете подписать со своей
          стороны.
        </p>
      )}

      {deal.status === 'act_signing' && (
        <SignDocumentDialog
          documentTitle={`Акт приёма-передачи к договору № ${deal.slug}`}
          documentText={generateActText(deal)}
          triggerLabel="Посмотреть и подписать акт"
          onSign={(code) => signAct(deal.id, code)}
        />
      )}

      {deal.status === 'completed' && (
        <p className="text-sm font-semibold text-success">Сделка завершена. Спасибо за заказ!</p>
      )}

      {deal.status === 'cancelled_refunded' && (
        <p className="text-sm font-semibold text-destructive">Сделка отменена, деньги возвращены (демо).</p>
      )}

      <DisputePanel deal={deal} disputes={disputes} />

      {(deal.status === 'dispute_open' || messages.length > 0) && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Переписка с оператором</h2>
          <MessageThread messages={messages} />
        </section>
      )}

      {ESCALATABLE.has(deal.status) && (
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold">Позвать оператора</h2>
          <Textarea
            value={operatorReason}
            onChange={(e) => setOperatorReason(e.target.value)}
            placeholder="Опишите проблему, например: задержка сроков"
          />
          <Button
            variant="outline"
            disabled={!operatorReason.trim()}
            onClick={() => {
              callOperator(deal.id, 'client', operatorReason.trim())
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
