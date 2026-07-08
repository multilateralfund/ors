import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { ProjectAssociationType } from '@ors/types/api_projects'

export function useGetPCRProjects(filters: Record<string, any>) {
  const { data, ...rest } = useApi<ProjectAssociationType[]>({
    options: {
      params: filters,
      withStoreCache: false,
    },
    path: '/api/project-association/',
  })
  const pcrsResults = getResults(data)

  return { ...rest, ...pcrsResults }
}
