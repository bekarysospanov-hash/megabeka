import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="text-lg font-semibold">Что-то пошло не так</h1>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.error.message}</p>
          <p className="text-sm text-muted-foreground">
            Демо-данные не потеряны — можно продолжить с главного экрана.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              this.setState({ error: null })
              window.location.href = '/'
            }}
          >
            На главную
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
