import { ConfirmOptions } from '@ors/contexts/ConfirmDialog.tsx'
import { createContext, useContext } from 'react'

interface ConfirmationContextProps {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmationContext =
  createContext<ConfirmationContextProps | null>(null)

export function useConfirmation() {
  const ctx = useContext(ConfirmationContext)
  if (!ctx) {
    throw new Error('useConfirmation must be used inside ConfirmationProvider')
  }
  return ctx.confirm
}
