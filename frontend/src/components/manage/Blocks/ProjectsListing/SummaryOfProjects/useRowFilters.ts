import useApi from '@ors/hooks/useApi.ts'
import { ApiSummaryOfProjectsFilters } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import { useEffect, useMemo } from 'react'

const useRowFilters = (apiParams: Record<string, any>) => {
  const rowFiltersApi = useApi<ApiSummaryOfProjectsFilters>({
    options: { params: apiParams },
    path: 'api/summary-of-projects/filters',
  })

  const { setParams } = rowFiltersApi

  useEffect(() => {
    setParams(apiParams)
  }, [setParams, apiParams])

  const rowFilters = useMemo(() => {
    if (rowFiltersApi.loaded && rowFiltersApi.data) {
      return rowFiltersApi.data
    }
    return null
  }, [rowFiltersApi.loaded, rowFiltersApi.data])

  return {
    rowFilters,
    setRowFiltersParams: setParams,
  }
}

export default useRowFilters
