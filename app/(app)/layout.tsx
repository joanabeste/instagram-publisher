import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '../(auth)/actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            ReelForge
          </Link>
          <nav className="hidden gap-4 text-sm text-zinc-600 sm:flex dark:text-zinc-400">
            <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Dashboard
            </Link>
            <Link href="/ideas" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Ideen
            </Link>
            <Link href="/scripts" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Skripte
            </Link>
            <Link href="/schedule" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Queue
            </Link>
            <Link href="/accounts" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Accounts
            </Link>
            <Link href="/settings" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Einstellungen
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
            {user.email}
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Logout
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
