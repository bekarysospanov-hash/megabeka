// Не криптографический — только для отличимости демо-сущностей друг от друга в рамках сессии.
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}
