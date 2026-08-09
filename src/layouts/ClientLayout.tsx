import { Link, Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { DemoBar } from '../components/DemoBar'
import { Footer } from '../components/Footer'
import { NotificationBell } from '../components/NotificationBell'

export function ClientLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-full max-w-md items-center justify-between px-4">
          <Link to="/">
            <Logo />
          </Link>
          <NotificationBell />
        </div>
      </header>

      <DemoBar />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
