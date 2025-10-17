import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'
import { ApiBPActivity } from '@ors/types/api_bp_get.ts'

export function useGetActivities(initialFilters: any, shouldFetch = true) {
  const { data, loading, params, setParams } = useApi<ApiBPActivity[]>({
    options: {
      triggerIf: shouldFetch,
      params: { ...initialFilters },
      withStoreCache: false,
    },
    path: 'api/business-plan-activity/',
  })
  const { count, loaded, results } = getResults(data)

  return { count, loaded, loading, params, results, setParams }
}
