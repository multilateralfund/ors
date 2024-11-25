import { ApiBPGet } from '@ors/types/api_bp_get'

import { useMemo } from 'react'

import { useParams } from 'next/navigation'

import { bpTypes } from '@ors/components/manage/Blocks/BusinessPlans/constants'
import { getAgencyByName } from '@ors/components/manage/Blocks/BusinessPlans/utils'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import BPContext from './BPContext'
import { BPProviderProps } from './types'

const BP_PER_PAGE = 20

function BPProvider(props: BPProviderProps) {
  const { children } = props

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
        limit: BP_PER_PAGE,
        offset: 0,
        version_type: bpTypes[0].id,
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
