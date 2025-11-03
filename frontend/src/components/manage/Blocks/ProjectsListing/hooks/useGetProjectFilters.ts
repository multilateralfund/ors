import useApi from '@ors/hooks/useApi'

export function useGetProjectFilters(filters: any) {
  return useApi({
    options: { params: filters, withStoreCache: false },
    path: `api/projects/v2/list_filters/`,
  })
}
