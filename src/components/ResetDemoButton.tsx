import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDemoActions } from '../store/DemoProvider'
import { GUARANTEE_SEEN_STORAGE_KEY } from './GuaranteeCertificateDialog'

export function ResetDemoButton() {
  const { resetDemo } = useDemoActions()

  function handleReset() {
    window.localStorage.removeItem(GUARANTEE_SEEN_STORAGE_KEY)
    resetDemo()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Сбросить демо
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Сбросить демо?</AlertDialogTitle>
          <AlertDialogDescription>
            Вернём три исходных сценария. Все свои изменения в текущей сессии будут потеряны.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>Сбросить</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
