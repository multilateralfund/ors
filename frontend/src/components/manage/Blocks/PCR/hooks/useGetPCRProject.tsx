import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { PCRMetaProjectType } from '@ors/types/api_projects'

export function useGetPCRProject(project_id: string) {
  return useApi<PCRMetaProjectType>({
    options: {
      triggerIf: !!project_id,
      withStoreCache: false,
    },
    path: `/api/pcr-metaprojects/${project_id}/`,
  })
}
