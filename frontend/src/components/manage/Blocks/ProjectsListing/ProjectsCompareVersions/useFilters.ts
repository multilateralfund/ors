import useApi from '@ors/hooks/useApi.ts'
import { ApiFilters } from './types.ts'
import { useEffect, useMemo } from 'react'

const useFilters = (apiParams: Record<string, any>) => {
  const filtersApi = useApi<ApiFilters>({
    options: { params: apiParams },
    path: 'api/compare-versions/filters',
  })

  const { setParams } = filtersApi

  useEffect(() => {
    setParams(apiParams)
  }, [setParams, apiParams])

  const filterOptions = useMemo(() => {
    if (filtersApi.loaded && filtersApi.data) {
      return filtersApi.data
    }
    return null
  }, [filtersApi.loaded, filtersApi.data])

  return {
    filterOptions,
    setFiltersParams: setParams,
  }
}

export default useFilters
