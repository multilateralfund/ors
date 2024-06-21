import { BusinessPlanData } from '@ors/types/store'

import { useEffect, useMemo } from 'react'

import { useParams } from 'next/navigation'

import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

export type BpPathParams = {
  agency: string
  end_year: string
  start_year: string
}

interface Params {
  [key: string]: any

  limit?: number
  offset?: number
}

interface UseGetBsPlanReturn {
  data: BusinessPlanData
  loaded: boolean
  loading: boolean
  pathParams: BpPathParams
  setParams: (params: Record<string, any>) => void
}

const BP_PER_PAGE = 20

const useGetBpData = (params?: Params): UseGetBsPlanReturn => {
  const pathParams = useParams<BpPathParams>()
  const { agency, end_year, start_year } = pathParams
  const commonSlice = useStore((state) => state.common)
  const currentAgency = useMemo(() => {
    return commonSlice.agencies.data.find((item: any) => item.name === agency)
  }, [agency, commonSlice.agencies.data])

  const { data, loaded, loading, setParams } = useApi({
    options: {
      params: {
        agency_id: currentAgency?.id,
        limit: BP_PER_PAGE,
        offset: 0,
        year_end: end_year,
        year_start: start_year,
        ...params,
      },
      withStoreCache: true,
    },
    path: 'api/business-plan-record/',
  })

  const { businessPlanData, setBusinessPlanData } = useStore(
    (state) => state.businessPlanData,
  )

  useEffect(() => {
    if (data && data.results) {
      setBusinessPlanData(data.results)
    }
  }, [data])

  return { data: businessPlanData, loaded, loading, pathParams, setParams }
}

export default useGetBpData
