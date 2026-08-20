import type { Deal, DealStatus, Milestone, Transaction } from './types'

/**
 * Этапы сделки (FR-03). В прототипе они выводятся из уже согласованной схемы траншей, а не
 * задаются отдельно: доли те же, что видит клиент в блоке «Деньги», — расхождение между
 * обещанной схемой и фактическими этапами было бы хуже, чем отсутствие гибкости.
 *
 * Последний этап всегда «Приёмка» (FR-03) и мебельщиком не берётся: его закрывает подпись
 * клиента или истечение окна приёмки (7.4).
 */
export function buildMilestones(deal: Deal): Milestone[] {
  const milestones: Milestone[] = []
  const push = (title: string, sharePercent: number, isFinal = false) => {
    if (sharePercent <= 0) return
    milestones.push({
      dealId: deal.id,
      orderNo: milestones.length + 1,
      title,
      sharePercent,
      isFinal,
      status: 'planned',
      confirmedAt: null,
    })
  }

  push('Закуп материалов', deal.prepaymentPercent)
  push('Изделие изготовлено', deal.interimPercent)
  push('Приёмка заказа', deal.finalPercent, true)
  return milestones
}

/** Сумма, которую получит мебельщик за этап: доля сделки за вычетом комиссии. */
export function milestoneAmount(deal: Deal, milestone: Milestone): number {
  const gross = (deal.amount * milestone.sharePercent) / 100
  return gross - (gross * deal.commissionPercent) / 100
}

/**
 * Этап, транш по которому мебельщик может взять прямо сейчас. Этапы идут по порядку: пока
 * предыдущий не взят, следующий недоступен — иначе всю сумму до приёмки можно было бы
 * выбрать одним действием, минуя схему раскрытия, согласованную с клиентом.
 */
export function nextClaimableMilestone(milestones: Milestone[]): Milestone | null {
  const ordered = [...milestones].sort((a, b) => a.orderNo - b.orderNo)
  for (const milestone of ordered) {
    if (milestone.isFinal) return null
    if (milestone.status === 'planned') return milestone
    if (milestone.status !== 'confirmed') return null
  }
  return null
}

function replace(milestones: Milestone[], orderNo: number, patch: Partial<Milestone>): Milestone[] {
  return milestones.map((m) => (m.orderNo === orderNo ? { ...m, ...patch } : m))
}

function find(milestones: Milestone[], orderNo: number): Milestone {
  const milestone = milestones.find((m) => m.orderNo === orderNo)
  if (!milestone) throw new Error(`Этап ${orderNo} не найден`)
  return milestone
}

/**
 * Статусы, на которых транш под этап можно взять: работа идёт или сдаётся. Спор сюда не входит —
 * в нём изделия либо нет, либо оно негодное, и деньги обязаны стоять. Терминальные статусы тоже:
 * по завершённой сделке транши уже разошлись, по закрытой возвратом деньги ушли клиенту.
 */
const ADVANCE_STATUSES: DealStatus[] = ['in_production', 'remedy', 'awaiting_acceptance', 'act_signing']

/** То же правило для интерфейса: кнопку не показываем там, где домен откажет. */
export function canTakeMilestoneAdvance(dealStatus: DealStatus, frozen: boolean): boolean {
  return !frozen && ADVANCE_STATUSES.includes(dealStatus)
}

/**
 * FR-19: заявить готовность нельзя, пока по какому-то этапу не взят транш. Иначе сделка дойдёт
 * до «Завершена» с невзятой долей, и деньги мебельщика останутся лежать на платформе без адресата.
 */
export function firstUntakenMilestone(milestones: Milestone[]): Milestone | null {
  const ordered = [...milestones].sort((a, b) => a.orderNo - b.orderNo)
  return ordered.find((m) => !m.isFinal && m.status !== 'confirmed') ?? null
}

/**
 * Мебельщик берёт транш под этап. Ни фотографий, ни подтверждения оператором: в пилоте работают
 * мебельщики, которым платформа доверяет, и контроль стоит не на ходе работ, а на движении денег —
 * вывод транша оператор подтверждает в очереди запросов на перевод (FR-35).
 *
 * Почему транш раскрывается до работы, а не после: первый этап — закуп материалов, и деньги на
 * него нужны заранее. Требование «сначала закупи, потом получи» заставляло мебельщика
 * финансировать заказ из своего кармана, чего мелкие мастерские не могут (PRD 13.3, вопрос
 * финансирования закупа). Договор (п. 2.3) ровно это и обещает: доля доступна сразу после оплаты.
 */
export function takeMilestoneAdvance(
  milestones: Milestone[],
  orderNo: number,
  dealStatus: DealStatus,
  frozen: boolean,
): Milestone[] {
  const milestone = find(milestones, orderNo)

  if (frozen) {
    throw new Error('Сделка заморожена на время разбора: взять транш нельзя')
  }
  if (dealStatus === 'dispute_open') {
    throw new Error('По сделке открыт спор: транши не раскрываются до решения арбитра')
  }
  if (!ADVANCE_STATUSES.includes(dealStatus)) {
    throw new Error('Сделка закрыта: взять транш по ней нельзя')
  }
  if (milestone.isFinal) {
    throw new Error('Финальный этап не берётся траншем: его закрывает приёмка заказа клиентом')
  }
  // Повторное взятие раскрыло бы долю второй раз — это выдача одних денег дважды, а не повтор.
  if (milestone.status !== 'planned') {
    throw new Error('Транш по этому этапу уже взят')
  }
  if (nextClaimableMilestone(milestones)?.orderNo !== orderNo) {
    throw new Error('Этапы идут по порядку: транш по предыдущему ещё не взят')
  }

  return replace(milestones, orderNo, {
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
  })
}

/** Финальный этап закрывается приёмкой — единственный переход, который делает не человек (7.4). */
export function closeFinalMilestone(milestones: Milestone[]): Milestone[] {
  const final = milestones.find((m) => m.isFinal)
  if (!final) return milestones
  return replace(milestones, final.orderNo, {
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
  })
}

/**
 * Тип транша по этапу. Сохраняет существующие типы транзакций, чтобы блок «Деньги» у клиента
 * и список поступлений у мебельщика продолжали различать предоплату, промежуточный и
 * финальный платёж.
 */
function milestoneTransactionType(milestone: Milestone): Transaction['type'] {
  if (milestone.isFinal) return 'final'
  return milestone.orderNo === 1 ? 'prepayment' : 'interim'
}

/** Транш, порождаемый взятием этапа мебельщиком. */
export function buildMilestonePayout(deal: Deal, milestone: Milestone): Transaction {
  return {
    dealId: deal.id,
    type: milestoneTransactionType(milestone),
    amount: milestoneAmount(deal, milestone),
    status: 'paid',
    paidAt: new Date().toISOString(),
  }
}
