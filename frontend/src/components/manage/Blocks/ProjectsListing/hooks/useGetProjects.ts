import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { ProjectType } from '@ors/types/api_projects.ts'

export function useGetProjects(filters: Record<string, any>) {
  const { data, ...rest } = useApi<ProjectType[]>({
    options: {
      params: filters,
      withStoreCache: false,
    },
    path: '/api/projects/v2/',
  })
  const projectsResults = getResults(data)

  return { ...rest, ...projectsResults }
}
