import { APRContext } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import { PropsWithChildren, useContext } from 'react'
import useApi from '@ors/hooks/useApi.ts'
import { AnnualProgressReportCurrentYear } from '@ors/app/annual-project-report/types.ts'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'

interface APRProviderProps extends PropsWithChildren {}

export default function APRProvider({ children }: APRProviderProps) {
  const { canViewAPR } = useContext(PermissionsContext)
  const aprCurrentYear = useApi<AnnualProgressReportCurrentYear>({
    options: {
      withStoreCache: false,
      triggerIf: canViewAPR,
    },
    path: `api/annual-project-report/current-year/`,
  })

  return (
    <APRContext.Provider value={{ aprCurrentYear }}>
      {children}
    </APRContext.Provider>
  )
}
