import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { generateContractText } from '../domain/contractTemplate'
import type { Deal } from '../domain/types'

// Только предпросмотр — без подписания и без TrustMe-имитации, в отличие от SignDocumentDialog.
// Мебельщик может посмотреть, как условия сложатся в текст договора, до того как клиент вообще
// увидит сделку (SCREENS-AUDIT, экран №2 / раздел 16 PRD, п.15).
export function ContractPreviewDialog({ deal }: { deal: Deal }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Предпросмотр договора
      </Button>
      <DialogContent className="max-h-[85vh] grid-rows-[auto_1fr_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Предпросмотр договора</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
          {generateContractText(deal)}
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
