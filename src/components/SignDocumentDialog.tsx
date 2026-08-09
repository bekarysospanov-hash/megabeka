import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DemoModeBanner } from './DemoModeBanner'

export function SignDocumentDialog({
  documentTitle,
  documentText,
  triggerLabel,
  onSign,
}: {
  documentTitle: string
  documentText: string
  triggerLabel: string
  onSign: (code: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setCode('')
      }}
    >
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <DialogContent className="max-h-[85vh] grid-rows-[auto_1fr_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{documentTitle}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
          {documentText}
        </div>
        <DialogFooter className="flex-col items-stretch gap-3 sm:flex-col sm:items-stretch">
          <DemoModeBanner>СМС реально не отправляется — подойдёт любой код.</DemoModeBanner>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Код из СМС"
              className="flex-1"
            />
            <Button
              disabled={code.trim().length === 0}
              onClick={() => {
                onSign(code.trim())
                setOpen(false)
                setCode('')
              }}
            >
              Подписать
            </Button>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="w-fit">
              Закрыть без подписания
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
