import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const OFFER_TEXT = `Договор оферты Asia Mebel — Безопасная сделка (пилот)

Продолжая пользоваться сервисом, вы соглашаетесь с условиями настоящего договора оферты:
деньги по сделке удерживаются платформой Asia Mebel до подписания сторонами акта
приёма-передачи, платформа выступает посредником между клиентом и мебельщиком, а условия
конкретного заказа фиксируются в отдельном договоре подряда по этой сделке.

Это пилотная версия сервиса — полный юридический текст оферты будет опубликован отдельно.`

// Автосогласие при входе — без отдельной галочки/чекбокса, клиент соглашается самим
// продолжением работы с сервисом (см. фидбек по итогам теста прототипа, п.6).
export function OfferAgreementNote() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <p className="text-xs text-muted-foreground">
        Продолжая, вы соглашаетесь с условиями{' '}
        <DialogTrigger asChild>
          <button type="button" className="underline underline-offset-2 hover:text-foreground">
            Договора оферты
          </button>
        </DialogTrigger>
        .
      </p>
      <DialogContent className="max-h-[85vh] grid-rows-[auto_1fr_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Договор оферты</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
          {OFFER_TEXT}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Понятно</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
