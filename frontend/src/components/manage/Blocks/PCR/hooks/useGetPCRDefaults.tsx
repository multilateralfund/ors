import { PCRDefaultData } from '../interfaces'
import useApi from '@ors/hooks/useApi'

export function useGetPCRDefaults(project_id: string) {
  return useApi<PCRDefaultData>({
    options: {
      params: { meta_project_id: project_id },
      withStoreCache: false,
    },
    path: '/api/project-completion-reports/create/',
    reactivePath: true,
  })
}
