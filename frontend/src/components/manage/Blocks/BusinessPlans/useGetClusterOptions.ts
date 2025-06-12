import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export const useGetClusterOptions = () => {
  const { data } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-cluster-types-sectors/',
  })
  const { results } = getResults(data)

  return { results }
}
