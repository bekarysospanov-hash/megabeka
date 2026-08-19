import {
  callOperator,
  clientAccepts,
  createDeal,
  freezeDispute,
  markProductionDone,
  onboardClient,
  pay,
  requestRevision,
  resolveDispute,
  sendToClient,
  signAct,
  signActByFurnitureMaker,
  signByClientSms,
  signByFurnitureMaker,
  submitPayment,
} from './dealMachine'
import { DEFAULT_COMMISSION_PERCENT } from './dealLimits'
import {
  buildMilestonePayout,
  closeFinalMilestone,
  confirmMilestone,
  declareMilestone,
} from './milestones'
import type { CreateDealInput, Deal, DisputeLog, Milestone, RevisionEntry, Transaction } from './types'

/**
 * Демо-данные: проводит первый этап через заявление и подтверждение, как это сделали бы
 * мебельщик и оператор. Транш появляется только здесь — сама оплата клиентом денег
 * мебельщику больше не раскрывает (FR-14).
 */
function settleFirstMilestone(deal: Deal, milestones: Milestone[]) {
  const declared = declareMilestone(milestones, 1, ['demo-photo'])
  const confirmed = confirmMilestone(declared, 1)
  return {
    milestones: confirmed,
    transaction: buildMilestonePayout(deal, confirmed[0]),
  }
}

export interface DemoScenario {
  key: 'happy' | 'revisions' | 'dispute'
  deal: Deal
  revisions: RevisionEntry[]
  transactions: Transaction[]
  disputes: DisputeLog[]
  milestones: Milestone[]
}

const HAPPY_INPUT: CreateDealInput = {
  furnitureMakerId: 'fm-happy',
  title: 'Шкаф-купе в прихожую',
  amount: 800_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: DEFAULT_COMMISSION_PERCENT,
  estimatedProductionDays: 14,
}

const REVISIONS_INPUT: CreateDealInput = {
  furnitureMakerId: 'fm-revisions',
  title: 'Кухонный гарнитур на заказ',
  amount: 1_200_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: DEFAULT_COMMISSION_PERCENT,
  estimatedProductionDays: 21,
}

const DISPUTE_INPUT: CreateDealInput = {
  furnitureMakerId: 'fm-dispute',
  title: 'Гардеробная система',
  amount: 650_000,
  prepaymentPercent: 50,
  finalPercent: 50,
  commissionPercent: DEFAULT_COMMISSION_PERCENT,
  estimatedProductionDays: 10,
}

function buildHappyScenario(): DemoScenario {
  let deal = onboardClient(sendToClient(createDeal(HAPPY_INPUT)), 'Айгерим Сериковна', '+77011110000')
  deal = signByFurnitureMaker(clientAccepts(deal), '0000')
  deal = signByClientSms(deal, '1111')
  deal = submitPayment(deal, 'card')
  const paid = pay(deal)
  const stage1 = settleFirstMilestone(paid.deal, paid.milestones)
  deal = markProductionDone(paid.deal)
  deal = signActByFurnitureMaker(deal, '9999')
  const final = signAct(deal, '9999')

  return {
    key: 'happy',
    deal: final.deal,
    revisions: [],
    transactions: [stage1.transaction, final.transaction],
    disputes: [],
    milestones: closeFinalMilestone(stage1.milestones),
  }
}

function buildRevisionsScenario(): DemoScenario {
  let deal = onboardClient(sendToClient(createDeal(REVISIONS_INPUT)), 'Данияр Ахметов', '+77022220000')

  const r1 = requestRevision(deal, 'amount', '1200000', '1150000', 'скидка за объём')
  deal = r1.deal
  const r2 = requestRevision(
    deal,
    'deadline',
    '2026-09-01',
    '2026-09-15',
    'нужно больше времени на фурнитуру',
  )
  deal = r2.deal

  deal = signByFurnitureMaker(clientAccepts(deal), '0000')
  deal = signByClientSms(deal, '2222')
  deal = submitPayment(deal, 'card')
  const paid = pay(deal)
  const stage1 = settleFirstMilestone(paid.deal, paid.milestones)
  deal = markProductionDone(paid.deal)
  deal = signActByFurnitureMaker(deal, '9999')
  const final = signAct(deal, '9999')

  return {
    key: 'revisions',
    deal: final.deal,
    revisions: [r1.revision, r2.revision],
    transactions: [stage1.transaction, final.transaction],
    disputes: [],
    milestones: closeFinalMilestone(stage1.milestones),
  }
}

function buildDisputeScenario(): DemoScenario {
  let deal = onboardClient(sendToClient(createDeal(DISPUTE_INPUT)), 'Гульнара Тлеубердиева', '+77033330000')
  deal = signByFurnitureMaker(clientAccepts(deal), '0000')
  deal = signByClientSms(deal, '3333')
  deal = submitPayment(deal, 'card')
  const paid = pay(deal)
  const stage1 = settleFirstMilestone(paid.deal, paid.milestones)
  deal = paid.deal

  const opened = callOperator(deal, 'client', 'задержка сроков изготовления')
  const dispute: DisputeLog = { ...opened.dispute, status: 'resolved' }
  deal = freezeDispute(opened.deal)
  deal = resolveDispute(deal, { kind: 'rejected', newDeadline: '2026-09-15' }).deal

  deal = markProductionDone(deal)
  deal = signActByFurnitureMaker(deal, '9999')
  const final = signAct(deal, '9999')

  return {
    key: 'dispute',
    deal: final.deal,
    revisions: [],
    transactions: [stage1.transaction, final.transaction],
    disputes: [dispute],
    milestones: closeFinalMilestone(stage1.milestones),
  }
}

export function seedScenarios(): DemoScenario[] {
  return [buildHappyScenario(), buildRevisionsScenario(), buildDisputeScenario()]
}
