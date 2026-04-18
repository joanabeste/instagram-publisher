'use client'

import { useFormStatus } from 'react-dom'

export function ConfirmSubmit({
  message,
  className,
  children,
  pendingLabel,
}: {
  message: string
  className?: string
  children: React.ReactNode
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
      className={className}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}
