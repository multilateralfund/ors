import { createContext, useContext } from 'react'
import { ConfirmOptions } from '@ors/contexts/AnnualProjectReport/ConfirmDialog.tsx'
import { UseApiReturn } from '@ors/hooks/useApi.ts'
import { AnnualProgressReportCurrentYear } from '@ors/app/annual-project-report/types.ts'

interface APRContextProps {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  aprCurrentYear: UseApiReturn<AnnualProgressReportCurrentYear>
}

export const APRContext = createContext<APRContextProps | null>(null)

export function useConfirmation() {
  const ctx = useContext(APRContext)
  if (!ctx) {
    throw new Error('useConfirmation must be used inside ConfirmationProvider')
  }
  return ctx.confirm
}

export function useAPRCurrentYear() {
  const ctx = useContext(APRContext)
  if (!ctx) {
    throw new Error('useConfirmation must be used inside ConfirmationProvider')
  }
  return ctx.aprCurrentYear
}
