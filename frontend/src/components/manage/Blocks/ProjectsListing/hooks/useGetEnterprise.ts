import useApi from '@ors/hooks/useApi'

export function useGetEnterprise(enterprise_id: string) {
  return useApi({
    options: {
      withStoreCache: false,
    },
    path: `api/enterprises/${enterprise_id}/`,
  })
}
