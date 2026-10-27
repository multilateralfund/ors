import useApi from '@ors/hooks/useApi'

export function useGetPcrFilters(filters: Record<string, any>) {
  return useApi({
    options: { params: filters, withStoreCache: false },
    path: 'api/pcr-metaprojects/list_filters/',
  })
}
