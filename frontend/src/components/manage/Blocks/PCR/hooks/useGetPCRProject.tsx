import useApi from '@ors/hooks/useApi'
import { PCRMetaProjectType } from '@ors/types/api_projects'

export function useGetPCRProject(project_id: string) {
  return useApi<PCRMetaProjectType>({
    options: { withStoreCache: false },
    path: `/api/pcr-metaprojects/${project_id}/`,
    reactivePath: true,
  })
}
