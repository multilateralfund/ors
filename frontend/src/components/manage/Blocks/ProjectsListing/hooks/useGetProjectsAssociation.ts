import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { ProjectAssociationType } from '@ors/types/api_projects.ts'

export function useGetProjectsAssociation(
  filters: Record<string, any>,
  project_id?: string,
) {
  const { data, ...rest } = useApi<ProjectAssociationType[]>({
    options: {
      params: { ...filters, project_id },
      withStoreCache: false,
    },
    path: '/api/project-association/',
  })
  const projectsResults = getResults(data)

  return { ...rest, ...projectsResults }
}
