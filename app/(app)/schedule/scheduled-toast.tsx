'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function ScheduledToast() {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    toast.success('Post in die Queue gelegt.')
  }, [])
  return null
}
