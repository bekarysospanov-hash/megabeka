import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resizeImageFile } from '@/lib/resizeImage'
import { MAX_ATTACHMENTS_PER_DEAL } from '../store/DemoProvider'
import type { Attachment } from '../domain/types'

export function AttachmentGallery({
  attachments,
  onUpload,
}: {
  attachments: Attachment[]
  onUpload?: (dataUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const atLimit = attachments.length >= MAX_ATTACHMENTS_PER_DEAL

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !onUpload) return
    setError(null)
    try {
      const dataUrl = await resizeImageFile(files[0])
      onUpload(dataUrl)
    } catch {
      setError('Не удалось загрузить фото — попробуйте другой файл')
    }
  }

  if (attachments.length === 0 && !onUpload) {
    return <p className="text-sm text-muted-foreground">Референсов пока нет.</p>
  }

  return (
    <div className="grid gap-2">
      {attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {attachments.map((a, i) => (
            <img
              key={i}
              src={a.dataUrl}
              alt="Референс"
              className="aspect-square w-full rounded-md border object-cover"
            />
          ))}
        </div>
      )}
      {onUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={atLimit}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {atLimit ? `Максимум ${MAX_ATTACHMENTS_PER_DEAL} фото` : 'Добавить фото'}
          </Button>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </>
      )}
    </div>
  )
}
