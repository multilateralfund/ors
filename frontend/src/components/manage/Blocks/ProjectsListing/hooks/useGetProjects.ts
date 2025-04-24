import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'

export function useGetProjects(filters: any) {
  const { data, ...rest } = useApi({
    options: {
      params: filters,
      withStoreCache: false,
    },
    path: 'api/projects/v2/',
  })
  const projectsResults = getResults(data)

  return { ...rest, ...projectsResults }
}
