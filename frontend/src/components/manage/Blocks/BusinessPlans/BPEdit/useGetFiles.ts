import { useContext, useMemo } from 'react'

import BPDataContext from '@ors/contexts/BusinessPlans/BPDataContext'
import { getAgencyByName } from '../utils'
import useApi from '@ors/hooks/useApi'

export function useGetFiles(pathParams: { agency: string; period: string }) {
  const { agency, period } = pathParams

  const { agencies } = useContext(BPDataContext)

  const currentAgency = useMemo(
    () => getAgencyByName(agencies, agency),
    [agency, agencies],
  )

  return useApi({
    options: {
      params: {
        agency_id: currentAgency?.id,
        year_end: period.split('-')[1],
        year_start: period.split('-')[0],
      },
      withStoreCache: false,
    },
    path: 'api/business-plan/files/',
  })
}
