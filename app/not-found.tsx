import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Seite nicht gefunden</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Diese Route gibt es nicht — oder du hast keinen Zugriff.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Zum Dashboard
      </Link>
    </div>
  )
}
