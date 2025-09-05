import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { ProjectType } from '@ors/types/api_projects.ts'

export function useGetProjects(
  filters: Record<string, any>,
  withCache: boolean = false,
) {
  const { data, ...rest } = useApi<ProjectType[]>({
    options: {
      params: filters,
      withStoreCache: withCache,
    },
    path: '/api/projects/v2/',
  })
  const projectsResults = getResults(data)

  return { ...rest, ...projectsResults }
}
