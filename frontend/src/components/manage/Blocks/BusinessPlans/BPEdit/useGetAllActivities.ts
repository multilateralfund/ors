import { useMemo } from 'react'

import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import { getAgencyByName } from '../utils'

export function useGetAllActivities(pathParams: {
  agency: string
  period: string
}) {
  const { agency, period } = pathParams

  const commonSlice = useStore((state) => state.common)

  const currentAgency = useMemo(
    () => getAgencyByName(commonSlice, agency),
    [agency, commonSlice],
  )

  const { data, loading, params, setParams } = useApi({
    options: {
      params: {
        agency_id: currentAgency?.id,
        year_end: period.split('-')[1],
        year_start: period.split('-')[0],
      },
      withStoreCache: false,
    },
    path: 'api/business-plan/get/',
  })

  return { data, loading, params, setParams }
}
