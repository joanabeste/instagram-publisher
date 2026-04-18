import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'

export const metadata = { title: 'Onboarding — ReelForge' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('user_id', user!.id)
    .maybeSingle()

  if (profile?.onboarding_done) {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Briefing einrichten</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Zwei Minuten. Daraus generiert ReelForge deine Ideen, Skripte und Reels.
        </p>
      </div>
      <OnboardingForm />
    </div>
  )
}
