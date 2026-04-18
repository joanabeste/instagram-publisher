import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Lightbulb,
  ScrollText,
  CalendarClock,
  AtSign,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { signOutAction } from '../(auth)/actions'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ideas', label: 'Ideen', icon: Lightbulb },
  { href: '/scripts', label: 'Skripte', icon: ScrollText },
  { href: '/schedule', label: 'Queue', icon: CalendarClock },
  { href: '/accounts', label: 'Accounts', icon: AtSign },
  { href: '/settings', label: 'Einstellungen', icon: Settings },
] as const

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
          <nav className="hidden gap-1 text-sm text-zinc-600 sm:flex dark:text-zinc-400">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
            {user.email}
          </span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut />
              Logout
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
