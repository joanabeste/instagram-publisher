'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function AccountsToasts({
  connected,
  error,
}: {
  connected: boolean
  error: string | null
}) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    if (connected) toast.success('Account verknüpft.')
    if (error) toast.error(error)
  }, [connected, error])
  return null
}
