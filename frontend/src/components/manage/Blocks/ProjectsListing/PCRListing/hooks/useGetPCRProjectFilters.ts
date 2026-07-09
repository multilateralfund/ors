import useApi from '@ors/hooks/useApi'
import { PCRFilterOptions } from '../types'

export function useGetPCRProjectFilters(filters: Record<string, any>) {
  return useApi<PCRFilterOptions>({
    options: { params: filters, withStoreCache: false },
    path: 'api/project-completion-reports/list_filters/',
  })
}
