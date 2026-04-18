import { SignupForm } from './signup-form'

export const metadata = { title: 'Registrieren — ReelForge' }

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">ReelForge Account</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Starte in 30 Sekunden — Briefing später.
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
