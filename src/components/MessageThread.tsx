import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '../domain/statusLabels'
import type { Actor, Message } from '../domain/types'

const AUTHOR_LABELS: Record<Actor, string> = {
  client: 'Клиент',
  furniture_maker: 'Мебельщик',
  operator: 'Оператор',
}

export function MessageThread({
  messages,
  onSend,
}: {
  messages: Message[]
  onSend?: (text: string) => void
}) {
  const [text, setText] = useState('')

  return (
    <div className="grid gap-3">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Сообщений пока нет.</p>
      ) : (
        <ul className="grid gap-2">
          {messages.map((m, i) => (
            <li key={i} className="rounded-lg border p-3 text-sm">
              <div className="font-semibold">{AUTHOR_LABELS[m.author]}</div>
              <div>{m.text}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(m.at)}</div>
            </li>
          ))}
        </ul>
      )}
      {onSend && (
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать обеим сторонам"
          />
          <Button
            disabled={!text.trim()}
            onClick={() => {
              onSend(text.trim())
              setText('')
            }}
          >
            Отправить
          </Button>
        </div>
      )}
    </div>
  )
}
