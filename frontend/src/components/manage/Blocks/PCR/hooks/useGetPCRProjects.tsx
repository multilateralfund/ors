import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { PCRMetaProjectType } from '@ors/types/api_projects'

export function useGetPCRProjects({
  project_id,
  filters,
}: {
  project_id?: string
  filters?: Record<string, any>
}) {
  const { data, ...rest } = useApi<PCRMetaProjectType[]>({
    options: {
      params: { ...filters, project_id },
      withStoreCache: false,
    },
    path: '/api/pcr-metaprojects/',
  })
  const pcrsResults = getResults(data)

  return { ...rest, ...pcrsResults }
}
