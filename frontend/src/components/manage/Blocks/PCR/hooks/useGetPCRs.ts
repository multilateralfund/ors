import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'

export function useGetPCRs(filters: Record<string, any>) {
  const { data, ...rest } = useApi({
    options: {
      params: filters,
      withStoreCache: false,
    },
    path: '/api/projects/v2/',
  })
  const pcrsResults = getResults(data)

  return { ...rest, ...pcrsResults }
}
