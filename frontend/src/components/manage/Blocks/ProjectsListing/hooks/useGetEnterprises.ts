import useApi from '@ors/hooks/useApi'

export function useGetEnterprises(
  country_id: number | null,
  filters?: Record<string, any>,
) {
  return useApi({
    options: {
      params: { ...filters, country_id },
      withStoreCache: false,
    },
    path: 'api/enterprises',
  })
}
