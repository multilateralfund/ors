import { useMemo } from 'react'

import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import { getAgencyByName } from '../utils'

export function useGetFiles(pathParams: { agency: string; period: string }) {
  const { agency, period } = pathParams

  const commonSlice = useStore((state) => state.common)

  const currentAgency = useMemo(
    () => getAgencyByName(commonSlice, agency),
    [agency, commonSlice],
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
