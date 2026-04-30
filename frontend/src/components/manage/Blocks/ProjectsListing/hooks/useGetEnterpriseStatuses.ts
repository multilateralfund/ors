import useApi from '@ors/hooks/useApi'

export function useGetEnterpriseStatuses() {
  const { data } = useApi({
    options: {
      withStoreCache: true,
    },
    path: '/api/enterprise-statuses/',
  })

  return data
}
