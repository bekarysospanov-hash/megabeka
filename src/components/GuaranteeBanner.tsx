import { ShieldCheck } from 'lucide-react'

const TEXT = {
  client: 'Ваши деньги под защитой Asia Mebel — если сделка сорвётся, мы вернём вам оплату.',
  furniture_maker: 'Asia Mebel гарантирует: вы получите 100% оплаты при выполнении условий сделки.',
} as const

export function GuaranteeBanner({ perspective }: { perspective: keyof typeof TEXT }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm text-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>{TEXT[perspective]}</span>
    </div>
  )
}
