import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { PCRMetaProjectType } from '@ors/types/api_projects'

export function useGetPCRProjects(filters: Record<string, any>) {
  const { data, ...rest } = useApi<PCRMetaProjectType[]>({
    options: {
      params: filters,
      withStoreCache: false,
    },
    path: '/api/pcr-metaprojects/',
  })
  const pcrsResults = getResults(data)

  return { ...rest, ...pcrsResults }
}
