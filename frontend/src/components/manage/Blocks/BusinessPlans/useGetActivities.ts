import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export function useGetActivities(initialFilters: any) {
  const { data, error, loading, params, setParams } = useApi({
    options: {
      params: { ...initialFilters },
      withStoreCache: false,
    },
    path: 'api/business-plan-activity/',
  })
  const { count, loaded, results } = getResults(data)

  return { count, error, loaded, loading, params, results, setParams }
}
