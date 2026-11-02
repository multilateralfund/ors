import useApi from '@ors/hooks/useApi'
import { PCRVersion } from '../interfaces'

export function useGetPCRVersions(pcr_id?: string) {
  return useApi<PCRVersion[]>({
    options: { triggerIf: !!pcr_id, withStoreCache: false },
    path: pcr_id ? `api/project-completion-reports/${pcr_id}/versions/` : '',
    reactivePath: true,
  })
}
