import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import {
  autoAcceptDeal as autoAcceptDealFn,
  callOperator as callOperatorFn,
  cancelDeal as cancelDealFn,
  clientAccepts as clientAcceptsFn,
  createDeal as createDealFn,
  freezeDispute as freezeDisputeFn,
  initiateRefund as initiateRefundFn,
  markProductionDone as markProductionDoneFn,
  onboardClient as onboardClientFn,
  pay as payFn,
  payInterim as payInterimFn,
  rejectAct as rejectActFn,
  requestRevision as requestRevisionFn,
  requestRevisions as requestRevisionsFn,
  resolveDispute as resolveDisputeFn,
  retryPayment as retryPaymentFn,
  sendToClient as sendToClientFn,
  signAct as signActFn,
  signActByFurnitureMaker as signActByFurnitureMakerFn,
  signByClientSms as signByClientSmsFn,
  signByFurnitureMaker as signByFurnitureMakerFn,
  submitPayment as submitPaymentFn,
  updateDealSpec as updateDealSpecFn,
} from '../domain/dealMachine'
import { validatePaymentSplit } from '../domain/dealLimits'
import { generateId } from '../domain/id'
import {
  buildActRejectedNotification,
  buildClientAcceptedNotification,
  buildDealUpdatedNotification,
  buildInterimPaidNotification,
  buildNotificationEvents,
  buildPaymentRetryNotification,
  buildRevisionRequestedNotification,
  buildRevisionsRequestedNotification,
} from '../domain/notifications'
import { seedScenarios } from '../domain/seedScenarios'
import type {
  Actor,
  Attachment,
  CreateDealInput,
  Deal,
  DealSpecInput,
  DisputeLog,
  FurnitureMakerVerification,
  Message,
  NotificationEvent,
  PaymentMethod,
  PayoutRequisites,
  RevisionEntry,
  Transaction,
  TransferRequest,
} from '../domain/types'

const STORAGE_KEY = 'asia-mebel-demo-state-v2'
export const MAX_ATTACHMENTS_PER_DEAL = 4

interface DemoState {
  role: Actor
  deals: Record<string, Deal>
  revisions: RevisionEntry[]
  transactions: Transaction[]
  disputes: DisputeLog[]
  messages: Message[]
  attachments: Attachment[]
  payoutRequisites: PayoutRequisites | null
  notifications: NotificationEvent[]
  furnitureMakerVerification: FurnitureMakerVerification | null
  transferRequests: TransferRequest[]
}

function buildSeedState(): DemoState {
  const scenarios = seedScenarios()
  const deals: Record<string, Deal> = {}
  const revisions: RevisionEntry[] = []
  const transactions: Transaction[] = []
  const disputes: DisputeLog[] = []
  const notifications: NotificationEvent[] = []

  for (const scenario of scenarios) {
    deals[scenario.deal.id] = scenario.deal
    revisions.push(...scenario.revisions)
    transactions.push(...scenario.transactions)
    disputes.push(...scenario.disputes)
    notifications.push(...buildNotificationEvents(scenario.deal.id, scenario.deal.status))
  }

  return {
    role: 'furniture_maker',
    deals,
    revisions,
    transactions,
    disputes,
    messages: [],
    attachments: [],
    payoutRequisites: null,
    notifications,
    furnitureMakerVerification: null,
    transferRequests: [],
  }
}

function isValidDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (
    !(
      typeof v.role === 'string' &&
      typeof v.deals === 'object' &&
      v.deals !== null &&
      Array.isArray(v.revisions) &&
      Array.isArray(v.transactions) &&
      Array.isArray(v.disputes) &&
      Array.isArray(v.messages) &&
      Array.isArray(v.attachments) &&
      (v.payoutRequisites === null ||
        (typeof v.payoutRequisites === 'object' &&
          typeof (v.payoutRequisites as Record<string, unknown>).bankName === 'string')) &&
      Array.isArray(v.notifications) &&
      (v.furnitureMakerVerification === null || typeof v.furnitureMakerVerification === 'object') &&
      Array.isArray(v.transferRequests)
    )
  ) {
    return false
  }
  return Object.values(v.deals as Record<string, unknown>).every((deal) => {
    const d = deal as Record<string, unknown>
    return (
      typeof d.guaranteeIssuedAt === 'string' &&
      typeof d.acceptedWithRemarks === 'boolean' &&
      Array.isArray(d.specialMechanisms) &&
      Array.isArray(d.appliances) &&
      // Поля окна приёмки: без них блок «Если ничего не делать» молча не отрисуется, а
      // авто-приёмка откажется работать — сохранённое до их появления состояние отбрасываем.
      'acceptanceDeadline' in d &&
      'autoAcceptedAt' in d &&
      // Схема траншей, сохранённая до введения потолка FR-04 (например, 30/30/40), иначе
      // пережила бы обновление и показала бы на демонстрации запрещённый продуктом сплит.
      validatePaymentSplit(
        d.prepaymentPercent as number,
        (d.interimPercent as number) ?? 0,
        d.finalPercent as number,
      ).valid
    )
  })
}

function loadState(): DemoState {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return buildSeedState()
  try {
    const parsed: unknown = JSON.parse(raw)
    return isValidDemoState(parsed) ? parsed : buildSeedState()
  } catch {
    return buildSeedState()
  }
}

type Action =
  | { type: 'setRole'; role: Actor }
  | { type: 'resetDemo' }
  | { type: 'createDeal'; input: CreateDealInput }
  | { type: 'updateDeal'; dealId: string; input: DealSpecInput }
  | { type: 'sendToClient'; dealId: string }
  | { type: 'onboardClient'; dealId: string; name: string; phone: string }
  | { type: 'clientAccepts'; dealId: string }
  | {
      type: 'requestRevision'
      dealId: string
      field: string
      oldValue: string
      newValue: string
      comment: string
    }
  | {
      type: 'requestRevisions'
      dealId: string
      changes: { field: string; oldValue: string; newValue: string }[]
      comment: string
    }
  | { type: 'signByFurnitureMaker'; dealId: string; code: string }
  | { type: 'signByClientSms'; dealId: string; code: string }
  | { type: 'submitPayment'; dealId: string; method: PaymentMethod }
  | { type: 'pay'; dealId: string }
  | { type: 'markProductionDone'; dealId: string }
  | { type: 'signActByFurnitureMaker'; dealId: string; code: string }
  | { type: 'signAct'; dealId: string; code: string; remarks?: string | null }
  | { type: 'autoAcceptDeal'; dealId: string }
  | { type: 'rejectAct'; dealId: string; reason: string }
  | { type: 'payInterim'; dealId: string }
  | { type: 'callOperator'; dealId: string; openedBy: Actor; reason: string }
  | { type: 'freezeDispute'; dealId: string }
  | { type: 'initiateRefund'; dealId: string }
  | { type: 'resolveDispute'; dealId: string }
  | { type: 'cancelDeal'; dealId: string; actor: Actor; reason: string }
  | { type: 'retryPayment'; dealId: string }
  | { type: 'operatorSetStatus'; dealId: string; status: Deal['status'] }
  | { type: 'addMessage'; dealId: string; author: Actor; text: string }
  | { type: 'addAttachment'; dealId: string; dataUrl: string; addedBy: Actor }
  | { type: 'setPayoutRequisites'; bankName: string; accountNumber: string }
  | { type: 'markNotificationRead'; id: string }
  | { type: 'markAllNotificationsRead'; role: Actor }
  | { type: 'setFurnitureMakerVerification'; companyName: string; businessId: string; legalAddress: string }
  | { type: 'requestTransfer'; dealId: string; amount: number; purpose: string }

function notify(state: DemoState, dealId: string, status: Deal['status']): NotificationEvent[] {
  return [...state.notifications, ...buildNotificationEvents(dealId, status)]
}

// Для переходов, которые dealMachine.ts проводит через промежуточный статус за один вызов
// (например signByClientSms: contract_signing -> contract_signed -> payment_pending).
// Статусы берутся из разницы statusHistory до/после — не хардкодим их литералами, иначе
// список молча устареет, если граф в dealMachine.ts изменится.
function notifyForTransition(state: DemoState, before: Deal, after: Deal): NotificationEvent[] {
  const newStatuses = after.statusHistory.slice(before.statusHistory.length).map((h) => h.status)
  return [...state.notifications, ...newStatuses.flatMap((status) => buildNotificationEvents(after.id, status))]
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'setRole':
      return { ...state, role: action.role }
    case 'resetDemo':
      return buildSeedState()
    case 'createDeal': {
      const deal = createDealFn(action.input)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'updateDeal': {
      const before = state.deals[action.dealId]
      const deal = updateDealSpecFn(before, action.input)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications:
          before.status === 'negotiation'
            ? [...state.notifications, ...buildDealUpdatedNotification(deal.id)]
            : state.notifications,
      }
    }
    case 'sendToClient': {
      const deal = sendToClientFn(state.deals[action.dealId])
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'onboardClient': {
      const deal = onboardClientFn(state.deals[action.dealId], action.name, action.phone)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'requestRevision': {
      const { deal, revision } = requestRevisionFn(
        state.deals[action.dealId],
        action.field,
        action.oldValue,
        action.newValue,
        action.comment,
      )
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        revisions: [...state.revisions, revision],
        // Статус не меняется (остаётся negotiation) — своё, отличимое от общего текста
        // negotiation уведомление, иначе оно молча сливается с "клиент рассматривает условия".
        notifications: [...state.notifications, ...buildRevisionRequestedNotification(deal.id, action.field)],
      }
    }
    case 'requestRevisions': {
      const { deal, revisions } = requestRevisionsFn(state.deals[action.dealId], action.changes, action.comment)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        revisions: [...state.revisions, ...revisions],
        notifications: [
          ...state.notifications,
          ...buildRevisionsRequestedNotification(
            deal.id,
            action.changes.map((c) => c.field),
          ),
        ],
      }
    }
    case 'clientAccepts': {
      const deal = clientAcceptsFn(state.deals[action.dealId])
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: [...state.notifications, ...buildClientAcceptedNotification(deal.id)],
      }
    }
    case 'signByFurnitureMaker': {
      const deal = signByFurnitureMakerFn(state.deals[action.dealId], action.code)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'signByClientSms': {
      const before = state.deals[action.dealId]
      const deal = signByClientSmsFn(before, action.code)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notifyForTransition(state, before, deal),
      }
    }
    case 'submitPayment': {
      const deal = submitPaymentFn(state.deals[action.dealId], action.method)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'pay': {
      const before = state.deals[action.dealId]
      const { deal, transaction } = payFn(before)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        transactions: [...state.transactions, transaction],
        notifications: notifyForTransition(state, before, deal),
      }
    }
    case 'markProductionDone': {
      const deal = markProductionDoneFn(state.deals[action.dealId])
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'signActByFurnitureMaker': {
      const deal = signActByFurnitureMakerFn(state.deals[action.dealId], action.code)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'signAct': {
      const before = state.deals[action.dealId]
      const { deal, transaction } = signActFn(before, action.code, action.remarks)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        transactions: [...state.transactions, transaction],
        notifications: notifyForTransition(state, before, deal),
      }
    }
    case 'autoAcceptDeal': {
      const before = state.deals[action.dealId]
      // Демо-механика: ждать три рабочих дня на показе нельзя, поэтому вперёд проматывается
      // «сейчас», а не срок сделки. Подменять acceptanceDeadline нельзя — карточка потом
      // показала бы клиенту неверную дату, до которой он якобы не подписал акт.
      // Управление остаётся у демонстратора: автотаймера нет, как и у оплаты.
      const afterDeadline = before.acceptanceDeadline
        ? new Date(new Date(before.acceptanceDeadline).getTime() + 1000)
        : new Date()
      const { deal, transaction } = autoAcceptDealFn(before, afterDeadline)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        transactions: [...state.transactions, transaction],
        notifications: notifyForTransition(state, before, deal),
      }
    }
    case 'rejectAct': {
      const before = state.deals[action.dealId]
      const deal = rejectActFn(before, action.reason)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: [...state.notifications, ...buildActRejectedNotification(deal.id, deal.actRejectionReason)],
      }
    }
    case 'payInterim': {
      const before = state.deals[action.dealId]
      const { deal, transaction } = payInterimFn(before)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        transactions: [...state.transactions, transaction],
        notifications: [...state.notifications, ...buildInterimPaidNotification(deal.id)],
      }
    }
    case 'callOperator': {
      const { deal, dispute } = callOperatorFn(
        state.deals[action.dealId],
        action.openedBy,
        action.reason,
      )
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        disputes: [...state.disputes, dispute],
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'freezeDispute': {
      const deal = freezeDisputeFn(state.deals[action.dealId])
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'initiateRefund': {
      const deal = initiateRefundFn(state.deals[action.dealId])
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'resolveDispute': {
      const deal = resolveDisputeFn(state.deals[action.dealId])
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        disputes: state.disputes.map((d) =>
          d.dealId === deal.id && d.status === 'open' ? { ...d, status: 'resolved' } : d,
        ),
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'cancelDeal': {
      const before = state.deals[action.dealId]
      const deal = cancelDealFn(before, action.actor, action.reason)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notifyForTransition(state, before, deal),
      }
    }
    case 'retryPayment': {
      const deal = retryPaymentFn(state.deals[action.dealId])
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: [...state.notifications, ...buildPaymentRetryNotification(deal.id)],
      }
    }
    case 'operatorSetStatus': {
      const current = state.deals[action.dealId]
      if (current.status === action.status) return state
      const deal: Deal = {
        ...current,
        status: action.status,
        statusHistory: [
          ...current.statusHistory,
          { status: action.status, at: new Date().toISOString() },
        ],
      }
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        notifications: notify(state, deal.id, deal.status),
      }
    }
    case 'addMessage': {
      const message: Message = {
        dealId: action.dealId,
        author: action.author,
        text: action.text,
        at: new Date().toISOString(),
      }
      return { ...state, messages: [...state.messages, message] }
    }
    case 'addAttachment': {
      const existing = state.attachments.filter((a) => a.dealId === action.dealId)
      if (existing.length >= MAX_ATTACHMENTS_PER_DEAL) return state
      const attachment: Attachment = {
        dealId: action.dealId,
        dataUrl: action.dataUrl,
        addedBy: action.addedBy,
        at: new Date().toISOString(),
      }
      return { ...state, attachments: [...state.attachments, attachment] }
    }
    case 'setPayoutRequisites': {
      const payoutRequisites: PayoutRequisites = {
        bankName: action.bankName,
        accountNumber: action.accountNumber,
        savedAt: new Date().toISOString(),
      }
      return { ...state, payoutRequisites }
    }
    case 'markNotificationRead': {
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      }
    }
    case 'markAllNotificationsRead': {
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.recipientRole === action.role ? { ...n, read: true } : n,
        ),
      }
    }
    case 'setFurnitureMakerVerification': {
      const furnitureMakerVerification: FurnitureMakerVerification = {
        companyName: action.companyName,
        businessId: action.businessId,
        legalAddress: action.legalAddress,
        verifiedAt: new Date().toISOString(),
      }
      return { ...state, furnitureMakerVerification }
    }
    case 'requestTransfer': {
      const transferRequest: TransferRequest = {
        id: generateId(),
        dealId: action.dealId,
        amount: action.amount,
        purpose: action.purpose,
        requestedAt: new Date().toISOString(),
      }
      return { ...state, transferRequests: [...state.transferRequests, transferRequest] }
    }
    default:
      return state
  }
}

interface DemoContextValue {
  state: DemoState
  dispatch: React.Dispatch<Action>
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

function useDemoContext(): DemoContextValue {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo должен использоваться внутри DemoProvider')
  return ctx
}

export function useDemoState(): DemoState {
  return useDemoContext().state
}

export function useDeal(dealId: string | undefined): Deal | undefined {
  const state = useDemoContext().state
  return dealId ? state.deals[dealId] : undefined
}

export function useDealHistory(dealId: string | undefined) {
  const state = useDemoContext().state
  return useMemo(
    () => ({
      revisions: state.revisions.filter((r) => r.dealId === dealId),
      transactions: state.transactions.filter((t) => t.dealId === dealId),
      disputes: state.disputes.filter((d) => d.dealId === dealId),
      messages: state.messages.filter((m) => m.dealId === dealId),
      attachments: state.attachments.filter((a) => a.dealId === dealId),
      transferRequests: state.transferRequests.filter((r) => r.dealId === dealId),
    }),
    [
      state.revisions,
      state.transactions,
      state.disputes,
      state.messages,
      state.attachments,
      state.transferRequests,
      dealId,
    ],
  )
}

export function useNotifications(role: Actor) {
  const state = useDemoContext().state
  return useMemo(
    () =>
      state.notifications
        .filter((n) => n.recipientRole === role)
        .sort((a, b) => b.at.localeCompare(a.at)),
    [state.notifications, role],
  )
}

export function useDemoActions() {
  const { dispatch } = useDemoContext()

  return {
    setRole: useCallback((role: Actor) => dispatch({ type: 'setRole', role }), [dispatch]),
    resetDemo: useCallback(() => dispatch({ type: 'resetDemo' }), [dispatch]),
    createDeal: useCallback(
      (input: CreateDealInput) => dispatch({ type: 'createDeal', input }),
      [dispatch],
    ),
    updateDeal: useCallback(
      (dealId: string, input: DealSpecInput) => dispatch({ type: 'updateDeal', dealId, input }),
      [dispatch],
    ),
    sendToClient: useCallback(
      (dealId: string) => dispatch({ type: 'sendToClient', dealId }),
      [dispatch],
    ),
    onboardClient: useCallback(
      (dealId: string, name: string, phone: string) =>
        dispatch({ type: 'onboardClient', dealId, name, phone }),
      [dispatch],
    ),
    clientAccepts: useCallback(
      (dealId: string) => dispatch({ type: 'clientAccepts', dealId }),
      [dispatch],
    ),
    requestRevision: useCallback(
      (
        dealId: string,
        field: string,
        oldValue: string,
        newValue: string,
        comment: string,
      ) => dispatch({ type: 'requestRevision', dealId, field, oldValue, newValue, comment }),
      [dispatch],
    ),
    requestRevisions: useCallback(
      (dealId: string, changes: { field: string; oldValue: string; newValue: string }[], comment: string) =>
        dispatch({ type: 'requestRevisions', dealId, changes, comment }),
      [dispatch],
    ),
    signByFurnitureMaker: useCallback(
      (dealId: string, code: string) => dispatch({ type: 'signByFurnitureMaker', dealId, code }),
      [dispatch],
    ),
    signByClientSms: useCallback(
      (dealId: string, code: string) => dispatch({ type: 'signByClientSms', dealId, code }),
      [dispatch],
    ),
    submitPayment: useCallback(
      (dealId: string, method: PaymentMethod) => dispatch({ type: 'submitPayment', dealId, method }),
      [dispatch],
    ),
    pay: useCallback((dealId: string) => dispatch({ type: 'pay', dealId }), [dispatch]),
    markProductionDone: useCallback(
      (dealId: string) => dispatch({ type: 'markProductionDone', dealId }),
      [dispatch],
    ),
    signActByFurnitureMaker: useCallback(
      (dealId: string, code: string) => dispatch({ type: 'signActByFurnitureMaker', dealId, code }),
      [dispatch],
    ),
    autoAcceptDeal: useCallback(
      (dealId: string) => dispatch({ type: 'autoAcceptDeal', dealId }),
      [dispatch],
    ),
    signAct: useCallback(
      (dealId: string, code: string, remarks?: string | null) =>
        dispatch({ type: 'signAct', dealId, code, remarks }),
      [dispatch],
    ),
    rejectAct: useCallback(
      (dealId: string, reason: string) => dispatch({ type: 'rejectAct', dealId, reason }),
      [dispatch],
    ),
    payInterim: useCallback((dealId: string) => dispatch({ type: 'payInterim', dealId }), [dispatch]),
    callOperator: useCallback(
      (dealId: string, openedBy: Actor, reason: string) =>
        dispatch({ type: 'callOperator', dealId, openedBy, reason }),
      [dispatch],
    ),
    freezeDispute: useCallback(
      (dealId: string) => dispatch({ type: 'freezeDispute', dealId }),
      [dispatch],
    ),
    initiateRefund: useCallback(
      (dealId: string) => dispatch({ type: 'initiateRefund', dealId }),
      [dispatch],
    ),
    resolveDispute: useCallback(
      (dealId: string) => dispatch({ type: 'resolveDispute', dealId }),
      [dispatch],
    ),
    cancelDeal: useCallback(
      (dealId: string, actor: Actor, reason: string) =>
        dispatch({ type: 'cancelDeal', dealId, actor, reason }),
      [dispatch],
    ),
    retryPayment: useCallback(
      (dealId: string) => dispatch({ type: 'retryPayment', dealId }),
      [dispatch],
    ),
    operatorSetStatus: useCallback(
      (dealId: string, status: Deal['status']) =>
        dispatch({ type: 'operatorSetStatus', dealId, status }),
      [dispatch],
    ),
    addMessage: useCallback(
      (dealId: string, author: Actor, text: string) =>
        dispatch({ type: 'addMessage', dealId, author, text }),
      [dispatch],
    ),
    addAttachment: useCallback(
      (dealId: string, dataUrl: string, addedBy: Actor) =>
        dispatch({ type: 'addAttachment', dealId, dataUrl, addedBy }),
      [dispatch],
    ),
    setPayoutRequisites: useCallback(
      (bankName: string, accountNumber: string) =>
        dispatch({ type: 'setPayoutRequisites', bankName, accountNumber }),
      [dispatch],
    ),
    markNotificationRead: useCallback(
      (id: string) => dispatch({ type: 'markNotificationRead', id }),
      [dispatch],
    ),
    markAllNotificationsRead: useCallback(
      (role: Actor) => dispatch({ type: 'markAllNotificationsRead', role }),
      [dispatch],
    ),
    setFurnitureMakerVerification: useCallback(
      (companyName: string, businessId: string, legalAddress: string) =>
        dispatch({ type: 'setFurnitureMakerVerification', companyName, businessId, legalAddress }),
      [dispatch],
    ),
    requestTransfer: useCallback(
      (dealId: string, amount: number, purpose: string) =>
        dispatch({ type: 'requestTransfer', dealId, amount, purpose }),
      [dispatch],
    ),
  }
}
