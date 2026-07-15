import useApi from '@ors/hooks/useApi'
import { PCRMetaProjectType } from '@ors/types/api_projects'

export function useGetPCRProject(project_id?: string) {
  return useApi<PCRMetaProjectType>({
    options: {
      triggerIf: !!project_id,
      withStoreCache: false,
    },
    path: project_id ? `/api/pcr-metaprojects/${project_id}/` : '',
    reactivePath: true,
  })
}
