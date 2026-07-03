import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { PCRProject } from '../types'

export function useGetPCRProjects(filters: Record<string, any>) {
  const { data, ...rest } = useApi<PCRProject[]>({
    options: {
      params: filters,
      withStoreCache: false,
    },
    path: '/api/project-completion-reports/',
  })
  const projectsResults = getResults(data)

  return { ...rest, ...projectsResults }
}
