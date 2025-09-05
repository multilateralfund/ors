import useApi from '@ors/hooks/useApi'

export function useGetEnterprises(country_id: number) {
  return useApi({
    options: {
      params: { country_id },
      withStoreCache: false,
    },
    path: 'api/enterprises',
  })
}
