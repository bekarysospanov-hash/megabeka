import { Link, Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ProductHeaderMocks } from '../components/ProductHeaderMocks'
import { DemoBar } from '../components/DemoBar'
import { Sidebar } from '../components/Sidebar'
import { Footer } from '../components/Footer'
import { NotificationBell } from '../components/NotificationBell'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ProductHeaderMocks />
          </div>
        </div>
      </header>

      <div className="sticky top-14 z-10">
        <DemoBar />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  )
}
