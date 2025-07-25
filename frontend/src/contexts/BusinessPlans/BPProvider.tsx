import { useContext, useMemo } from 'react'

import { getAgencyByName } from '@ors/components/manage/Blocks/BusinessPlans/utils'
import BPDataContext from './BPDataContext'
import BPContext from './BPContext'
import { BPProviderProps } from './types'
import { ApiBPGet } from '@ors/types/api_bp_get'
import useApi from '@ors/hooks/useApi'

import { capitalize } from 'lodash'
import { useParams } from 'wouter'

const BP_PER_PAGE = 20

function BPProvider(props: BPProviderProps) {
  const { children, status } = props

  const pathParams = useParams<{ agency: string; period: string }>()
  const { agency, period } = pathParams

  const { agencies } = useContext(BPDataContext)

  const currentAgency = useMemo(
    () => getAgencyByName(agencies, agency),
    [agency, agencies],
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
