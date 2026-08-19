import type { Deal, Milestone, Transaction } from './types'

/**
 * Этапы сделки (FR-03). В прототипе они выводятся из уже согласованной схемы траншей, а не
 * задаются отдельно: доли те же, что видит клиент в блоке «Деньги», — расхождение между
 * обещанной схемой и фактическими этапами было бы хуже, чем отсутствие гибкости.
 *
 * Последний этап всегда «Приёмка» (FR-03) и мебельщиком не заявляется: его закрывает подпись
 * клиента или истечение окна приёмки (7.4) — единственное исключение из правила «подтверждает
 * человек».
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
      photos: [],
      declaredAt: null,
      confirmedAt: null,
      rejectReason: null,
    })
  }

  push('Материалы закуплены', deal.prepaymentPercent)
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
 * Этап, который мебельщик может заявить прямо сейчас. Этапы подтверждаются по порядку
 * (FR-13): пока предыдущий не подтверждён, следующий недоступен — иначе деньги уходили бы
 * за работу, которую никто не проверял.
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

/** FR-13: мебельщик заявляет выполнение этапа, приложив не менее одной фотографии. */
export function declareMilestone(
  milestones: Milestone[],
  orderNo: number,
  photos: string[],
): Milestone[] {
  const milestone = find(milestones, orderNo)

  if (milestone.isFinal) {
    throw new Error('Финальный этап не заявляется: его закрывает приёмка заказа клиентом')
  }
  if (photos.length === 0) {
    throw new Error('Приложите хотя бы одно фото: без них оператору нечего проверять')
  }
  if (milestone.status !== 'planned') {
    throw new Error(`Этап уже отправлен на проверку или подтверждён`)
  }
  if (nextClaimableMilestone(milestones)?.orderNo !== orderNo) {
    throw new Error('Этапы заявляются по порядку: предыдущий ещё не подтверждён')
  }

  return replace(milestones, orderNo, {
    status: 'declared',
    photos,
    declaredAt: new Date().toISOString(),
    rejectReason: null,
  })
}

/** FR-14: оператор подтверждает заявленный этап — создаётся задание на выплату транша. */
export function confirmMilestone(milestones: Milestone[], orderNo: number): Milestone[] {
  const milestone = find(milestones, orderNo)
  if (milestone.status !== 'declared') {
    throw new Error('Подтвердить можно только заявленный этап')
  }
  return replace(milestones, orderNo, {
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
  })
}

/** FR-14: отклонение обязательно сопровождается комментарием — иначе мебельщик не поймёт, что править. */
export function rejectMilestone(
  milestones: Milestone[],
  orderNo: number,
  reason: string,
): Milestone[] {
  const milestone = find(milestones, orderNo)
  if (milestone.status !== 'declared') {
    throw new Error('Отклонить можно только заявленный этап')
  }
  if (!reason.trim()) {
    throw new Error('Укажите причину отклонения: без неё мебельщик не поймёт, что исправлять')
  }
  return replace(milestones, orderNo, {
    status: 'planned',
    rejectReason: reason.trim(),
    declaredAt: null,
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

/** Транш, порождаемый подтверждением этапа (FR-14). */
export function buildMilestonePayout(deal: Deal, milestone: Milestone): Transaction {
  return {
    dealId: deal.id,
    type: milestoneTransactionType(milestone),
    amount: milestoneAmount(deal, milestone),
    status: 'paid',
    paidAt: new Date().toISOString(),
  }
}
