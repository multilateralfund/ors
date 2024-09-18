import { ApiBPGet } from '@ors/types/api_bp_get'

import { useMemo } from 'react'

import { useParams } from 'next/navigation'

import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import BPContext from './BPContext'
import { BPProviderProps } from './types'

const BP_PER_PAGE = 20

function BPProvider(props: BPProviderProps) {
  const { children } = props
  const user = useStore((state) => state.user)
  const isViewer = user.data.user_type === 'viewer'

  const pathParams = useParams<{ agency: string; period: string }>()
  const { agency, period } = pathParams
  const commonSlice = useStore((state) => state.common)

  const currentAgency = useMemo(() => {
    return commonSlice.agencies.data.find((item) => item.name === agency)
  }, [agency, commonSlice.agencies.data])

  const { data, loaded, loading, params, setParams } = useApi<ApiBPGet>({
    options: {
      params: {
        agency_id: currentAgency?.id,
        is_multi_year: true,
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
        isViewer,
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
