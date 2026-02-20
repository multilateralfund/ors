import useApi from '@ors/hooks/useApi.ts'
import { ApiBlanketApprovalDetailsFilters } from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/types.ts'
import { useEffect, useMemo } from 'react'

const useBlanketApprovalDetailsFilters = (apiParams: Record<string, any>) => {
  const filtersApi = useApi<ApiBlanketApprovalDetailsFilters>({
    options: { params: apiParams },
    path: 'api/blanket-approval-details/filters',
  })

  const { setParams } = filtersApi

  useEffect(() => {
    setParams(apiParams)
  }, [setParams, apiParams])

  const filters = useMemo(() => {
    if (filtersApi.loaded && filtersApi.data) {
      return filtersApi.data
    }
    return null
  }, [filtersApi.loaded, filtersApi.data])

  return {
    filters,
    setFiltersParams: setParams,
  }
}

export default useBlanketApprovalDetailsFilters
