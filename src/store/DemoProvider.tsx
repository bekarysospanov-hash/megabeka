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
  callOperator as callOperatorFn,
  clientAccepts as clientAcceptsFn,
  createDeal as createDealFn,
  freezeDispute as freezeDisputeFn,
  initiateRefund as initiateRefundFn,
  markProductionDone as markProductionDoneFn,
  onboardClient as onboardClientFn,
  pay as payFn,
  requestRevision as requestRevisionFn,
  resolveDispute as resolveDisputeFn,
  sendToClient as sendToClientFn,
  signAct as signActFn,
  signActByFurnitureMaker as signActByFurnitureMakerFn,
  signByClientSms as signByClientSmsFn,
  signByFurnitureMaker as signByFurnitureMakerFn,
  submitPayment as submitPaymentFn,
} from '../domain/dealMachine'
import { seedScenarios } from '../domain/seedScenarios'
import type {
  Actor,
  Attachment,
  CreateDealInput,
  Deal,
  DisputeLog,
  Message,
  PaymentMethod,
  PayoutRequisites,
  RevisionEntry,
  Transaction,
} from '../domain/types'

const STORAGE_KEY = 'asia-mebel-demo-state-v1'
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
}

function buildSeedState(): DemoState {
  const scenarios = seedScenarios()
  const deals: Record<string, Deal> = {}
  const revisions: RevisionEntry[] = []
  const transactions: Transaction[] = []
  const disputes: DisputeLog[] = []

  for (const scenario of scenarios) {
    deals[scenario.deal.id] = scenario.deal
    revisions.push(...scenario.revisions)
    transactions.push(...scenario.transactions)
    disputes.push(...scenario.disputes)
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
  }
}

function isValidDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.role === 'string' &&
    typeof v.deals === 'object' &&
    v.deals !== null &&
    Array.isArray(v.revisions) &&
    Array.isArray(v.transactions) &&
    Array.isArray(v.disputes) &&
    Array.isArray(v.messages) &&
    Array.isArray(v.attachments) &&
    (v.payoutRequisites === null || typeof v.payoutRequisites === 'object')
  )
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
  | { type: 'signByFurnitureMaker'; dealId: string; code: string }
  | { type: 'signByClientSms'; dealId: string; code: string }
  | { type: 'submitPayment'; dealId: string; method: PaymentMethod }
  | { type: 'pay'; dealId: string }
  | { type: 'markProductionDone'; dealId: string }
  | { type: 'signActByFurnitureMaker'; dealId: string; code: string }
  | { type: 'signAct'; dealId: string; code: string }
  | { type: 'callOperator'; dealId: string; openedBy: Actor; reason: string }
  | { type: 'freezeDispute'; dealId: string }
  | { type: 'initiateRefund'; dealId: string }
  | { type: 'resolveDispute'; dealId: string }
  | { type: 'operatorSetStatus'; dealId: string; status: Deal['status'] }
  | { type: 'addMessage'; dealId: string; author: Actor; text: string }
  | { type: 'addAttachment'; dealId: string; dataUrl: string; addedBy: Actor }
  | { type: 'setPayoutRequisites'; cardNumber: string; holderName: string }

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'setRole':
      return { ...state, role: action.role }
    case 'resetDemo':
      return buildSeedState()
    case 'createDeal': {
      const deal = createDealFn(action.input)
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'sendToClient': {
      const deal = sendToClientFn(state.deals[action.dealId])
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'onboardClient': {
      const deal = onboardClientFn(state.deals[action.dealId], action.name, action.phone)
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
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
      }
    }
    case 'clientAccepts': {
      const deal = clientAcceptsFn(state.deals[action.dealId])
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'signByFurnitureMaker': {
      const deal = signByFurnitureMakerFn(state.deals[action.dealId], action.code)
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'signByClientSms': {
      const deal = signByClientSmsFn(state.deals[action.dealId], action.code)
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'submitPayment': {
      const deal = submitPaymentFn(state.deals[action.dealId], action.method)
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'pay': {
      const { deal, transaction } = payFn(state.deals[action.dealId])
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        transactions: [...state.transactions, transaction],
      }
    }
    case 'markProductionDone': {
      const deal = markProductionDoneFn(state.deals[action.dealId])
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'signActByFurnitureMaker': {
      const deal = signActByFurnitureMakerFn(state.deals[action.dealId], action.code)
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'signAct': {
      const { deal, transaction } = signActFn(state.deals[action.dealId], action.code)
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        transactions: [...state.transactions, transaction],
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
      }
    }
    case 'freezeDispute': {
      const deal = freezeDisputeFn(state.deals[action.dealId])
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'initiateRefund': {
      const deal = initiateRefundFn(state.deals[action.dealId])
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
    }
    case 'resolveDispute': {
      const deal = resolveDisputeFn(state.deals[action.dealId])
      return {
        ...state,
        deals: { ...state.deals, [deal.id]: deal },
        disputes: state.disputes.map((d) =>
          d.dealId === deal.id && d.status === 'open' ? { ...d, status: 'resolved' } : d,
        ),
      }
    }
    case 'operatorSetStatus': {
      const current = state.deals[action.dealId]
      const deal: Deal = {
        ...current,
        status: action.status,
        statusHistory: [
          ...current.statusHistory,
          { status: action.status, at: new Date().toISOString() },
        ],
      }
      return { ...state, deals: { ...state.deals, [deal.id]: deal } }
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
        cardNumber: action.cardNumber,
        holderName: action.holderName,
        savedAt: new Date().toISOString(),
      }
      return { ...state, payoutRequisites }
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
    }),
    [state.revisions, state.transactions, state.disputes, state.messages, state.attachments, dealId],
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
    signAct: useCallback(
      (dealId: string, code: string) => dispatch({ type: 'signAct', dealId, code }),
      [dispatch],
    ),
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
      (cardNumber: string, holderName: string) =>
        dispatch({ type: 'setPayoutRequisites', cardNumber, holderName }),
      [dispatch],
    ),
  }
}
