import { formatMoney } from '../domain/statusLabels'
import { cn } from '@/lib/utils'

/**
 * Денежная сумма. Дизайн-спека (раздел 3) требует моноширинный шрифт с табличными цифрами
 * для всех чисел: «сумма, набранная основным шрифтом, — ошибка». Компонент существует, чтобы
 * это правило нельзя было забыть в новом месте — вызов formatMoney напрямую в JSX его теряет.
 *
 * Внутри связного предложения сумма остаётся обычным текстом: там моноширинный разрывает строку.
 */
export function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn('font-mono tabular-nums', className)}>{formatMoney(amount)}</span>
}
