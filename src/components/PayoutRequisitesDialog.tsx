import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PayoutRequisitesForm } from './PayoutRequisitesForm'

export function PayoutRequisitesDialog({ triggerLabel }: { triggerLabel: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Реквизиты для выплат</DialogTitle>
        </DialogHeader>
        <PayoutRequisitesForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
