import { LoginForm } from './login-form'

export const metadata = { title: 'Login — ReelForge' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>
}) {
  const { next, registered } = await searchParams

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Willkommen zurück</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Log dich ein, um zu deinem Dashboard zu gelangen.
        </p>
      </div>
      <LoginForm next={next} registered={registered === '1'} />
    </div>
  )
}
