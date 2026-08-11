import { useEffect, useState } from 'react'
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

type SignStep = 'redirecting' | 'trustme' | 'returning' | 'error'

const REDIRECT_DELAY_MS = 900
const RETURN_DELAY_MS = 700

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
  const [step, setStep] = useState<SignStep>('redirecting')
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!open || step !== 'redirecting') return
    const timer = setTimeout(() => setStep('trustme'), REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [open, step])

  useEffect(() => {
    if (!open || step !== 'returning') return
    const timer = setTimeout(() => {
      try {
        onSign(code)
        setOpen(false)
      } catch (err) {
        // Статус сделки мог измениться, пока диалог был открыт (например, эскалация оператором) —
        // показываем причину вместо тихого закрытия, не даём исключению всплыть выше React-дерева.
        console.error('Не удалось подписать документ:', err)
        setStep('error')
      }
    }, RETURN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [open, step, code, onSign])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setStep('redirecting')
          setCode('')
        }
      }}
    >
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0">
        {step === 'redirecting' && <RedirectingScreen />}
        {step === 'trustme' && (
          <TrustMeScreen
            documentTitle={documentTitle}
            documentText={documentText}
            code={code}
            onCodeChange={setCode}
            onSubmit={() => setStep('returning')}
          />
        )}
        {step === 'returning' && <ReturningScreen />}
        {step === 'error' && <ErrorScreen />}
      </DialogContent>
    </Dialog>
  )
}

function RedirectingScreen() {
  return (
    <div className="grid place-items-center gap-3 px-6 py-16 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <DialogTitle className="text-sm font-medium text-muted-foreground">Открываем TrustMe.kz…</DialogTitle>
    </div>
  )
}

function ReturningScreen() {
  return (
    <div className="grid place-items-center gap-3 px-6 py-16 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <DialogTitle className="text-sm font-medium text-muted-foreground">Возврат в Asia Mebel…</DialogTitle>
    </div>
  )
}

function ErrorScreen() {
  return (
    <div className="grid place-items-center gap-3 px-6 py-16 text-center">
      <DialogTitle className="text-sm font-medium text-destructive">Не удалось подписать</DialogTitle>
      <p className="max-w-xs text-sm text-muted-foreground">
        Статус сделки изменился, пока было открыто окно подписания. Закройте окно и обновите страницу сделки.
      </p>
      <DialogClose asChild>
        <Button variant="outline" size="sm">
          Закрыть
        </Button>
      </DialogClose>
    </div>
  )
}

function TrustMeScreen({
  documentTitle,
  documentText,
  code,
  onCodeChange,
  onSubmit,
}: {
  documentTitle: string
  documentText: string
  code: string
  onCodeChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="grid max-h-[85vh] grid-rows-[auto_1fr_auto]">
      <div className="flex items-center gap-2 border-b bg-slate-900 px-5 py-3 text-white">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-[10px] font-bold text-slate-900">
          TM
        </div>
        <span className="text-sm font-semibold">trustme.kz</span>
        <span className="ml-auto rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
          Демо-имитация
        </span>
      </div>
      <div className="overflow-y-auto px-6 py-4">
        <DialogHeader>
          <DialogTitle>{documentTitle}</DialogTitle>
        </DialogHeader>
        <div className="mt-3 whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
          {documentText}
        </div>
      </div>
      <DialogFooter className="flex-col items-stretch gap-3 border-t px-6 py-4 sm:flex-col sm:items-stretch">
        <DemoModeBanner>
          Подписание через TrustMe.kz имитируется — реального обращения к сервису нет, подойдёт любой код.
        </DemoModeBanner>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="Код из СМС от TrustMe.kz"
            className="flex-1"
          />
          <Button disabled={code.trim().length === 0} onClick={onSubmit}>
            Подписать
          </Button>
        </div>
        <DialogClose asChild>
          <Button variant="ghost" size="sm" className="w-fit">
            Закрыть без подписания
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  )
}
