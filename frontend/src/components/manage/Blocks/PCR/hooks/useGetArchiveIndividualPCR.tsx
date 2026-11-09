import { ArchiveIndividualPCRResponse } from '../interfaces'
import useApi from '@ors/hooks/useApi'

export function useGetArchiveIndividualPCR(pcr_id?: string) {
  return useApi<ArchiveIndividualPCRResponse>({
    options: { triggerIf: !!pcr_id, withStoreCache: false },
    path: pcr_id
      ? `api/legacy-individual-project-completion-reports/${pcr_id}/`
      : '',
    reactivePath: true,
  })
}
