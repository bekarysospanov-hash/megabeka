import { ShieldCheck } from 'lucide-react'
import { formatDate } from '../domain/statusLabels'

const TEXT = {
  client: 'Ваши деньги под защитой Asia Mebel — если сделка сорвётся, мы вернём вам оплату.',
  furniture_maker: 'Asia Mebel гарантирует: вы получите 100% оплаты при выполнении условий сделки.',
} as const

/**
 * Гарантия видна статусом, а не документом: сертификат как отдельный артефакт из продукта убран
 * (решение 19.08.2026) — PRD его не требует, гарантия там живёт обязательством по оферте.
 * Дата выдачи здесь единственное место, где `guaranteeIssuedAt` наблюдаем на экране.
 */
export function GuaranteeBanner({
  perspective,
  issuedAt,
}: {
  perspective: keyof typeof TEXT
  issuedAt?: string
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm text-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>
        {TEXT[perspective]}
        {issuedAt && (
          <span className="text-muted-foreground"> Гарантия действует с {formatDate(issuedAt)}.</span>
        )}
      </span>
    </div>
  )
}
