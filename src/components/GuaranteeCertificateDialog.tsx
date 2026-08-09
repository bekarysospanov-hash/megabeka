import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { generateGuaranteeText } from '../domain/guaranteeTemplate'
import type { Deal } from '../domain/types'

export const GUARANTEE_SEEN_STORAGE_KEY = 'asia-mebel-guarantee-seen-v1'
const SEEN_KEY = GUARANTEE_SEEN_STORAGE_KEY

function hasSeenCertificate(dealId: string): boolean {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    const seen: string[] = raw ? JSON.parse(raw) : []
    return seen.includes(dealId)
  } catch {
    return false
  }
}

function markCertificateSeen(dealId: string): void {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    const seen: string[] = raw ? JSON.parse(raw) : []
    if (!seen.includes(dealId)) {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, dealId]))
    }
  } catch {
    // localStorage недоступен — просто не запоминаем, диалог откроется заново при следующем заходе
  }
}

export function GuaranteeCertificateDialog({
  deal,
  triggerLabel = 'Посмотреть сертификат гарантии',
}: {
  deal: Deal
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (deal.status === 'draft' && !hasSeenCertificate(deal.id)) {
      setOpen(true)
      markCertificateSeen(deal.id)
    }
  }, [deal.id, deal.status])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <DialogContent className="max-h-[85vh] grid-rows-[auto_1fr_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Сертификат гарантии Asia Mebel</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
          {generateGuaranteeText(deal)}
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
