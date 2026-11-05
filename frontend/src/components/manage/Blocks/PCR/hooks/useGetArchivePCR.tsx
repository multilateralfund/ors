import { ArchivePCRResponse } from '../interfaces'
import useApi from '@ors/hooks/useApi'

export function useGetArchivePCR(pcr_id?: string) {
  return useApi<ArchivePCRResponse>({
    options: { triggerIf: !!pcr_id, withStoreCache: false },
    path: pcr_id ? `api/legacy-project-completion-reports/${pcr_id}/` : '',
    reactivePath: true,
  })
}
