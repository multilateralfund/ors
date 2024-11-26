import { ApiBPGet } from '@ors/types/api_bp_get'

import { useMemo } from 'react'

import { capitalize } from 'lodash'
import { useParams } from 'next/navigation'

import { getAgencyByName } from '@ors/components/manage/Blocks/BusinessPlans/utils'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import BPContext from './BPContext'
import { BPProviderProps } from './types'

const BP_PER_PAGE = 20

function BPProvider(props: BPProviderProps) {
  const { children, status } = props

  const pathParams = useParams<{ agency: string; period: string }>()
  const { agency, period } = pathParams
  const commonSlice = useStore((state) => state.common)

  const currentAgency = useMemo(
    () => getAgencyByName(commonSlice, agency),
    [agency, commonSlice],
  )

  const { data, loaded, loading, params, setParams } = useApi<ApiBPGet>({
    options: {
      params: {
        agency_id: currentAgency?.id,
        bp_status: capitalize(status),
        limit: BP_PER_PAGE,
        offset: 0,
        year_end: period.split('-')[1],
        year_start: period.split('-')[0],
      },
      withStoreCache: false,
    },
    path: 'api/business-plan/get/',
  })

  return (
    <BPContext.Provider
      value={{
        data,
        loaded,
        loading,
        params,
        setParams,
      }}
    >
      {children}
    </BPContext.Provider>
  )
}

export default BPProvider
