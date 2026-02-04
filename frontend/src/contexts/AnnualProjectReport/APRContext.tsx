import { createContext, useContext } from 'react'
import { UseApiReturn } from '@ors/hooks/useApi.ts'
import { AnnualProgressReportCurrentYear } from '@ors/app/annual-project-report/types.ts'

interface APRContextProps {
  aprCurrentYear: UseApiReturn<AnnualProgressReportCurrentYear>
}

export const APRContext = createContext<APRContextProps | null>(null)

export function useAPRCurrentYear() {
  const ctx = useContext(APRContext)
  if (!ctx) {
    throw new Error(
      'useAPRCurrentYear must be used inside ConfirmationProvider',
    )
  }
  return ctx.aprCurrentYear
}
