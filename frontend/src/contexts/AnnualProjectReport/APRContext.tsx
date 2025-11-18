import { createContext, useContext } from 'react'
import { ConfirmOptions } from '@ors/contexts/AnnualProjectReport/ConfirmDialog.tsx'

interface APRContextProps {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const APRContext = createContext<APRContextProps | null>(null)

export function useConfirmation() {
  const ctx = useContext(APRContext)
  if (!ctx) {
    throw new Error('useConfirmation must be used inside ConfirmationProvider')
  }
  return ctx.confirm
}
