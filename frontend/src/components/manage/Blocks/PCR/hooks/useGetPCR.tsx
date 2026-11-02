import useApi from '@ors/hooks/useApi'
import { PCRResponse } from '../interfaces'

export function useGetPCR(pcr_id?: string) {
  return useApi<PCRResponse>({
    options: { triggerIf: !!pcr_id, withStoreCache: false },
    path: pcr_id ? `api/project-completion-reports/${pcr_id}/` : '',
    reactivePath: true,
  })
}
