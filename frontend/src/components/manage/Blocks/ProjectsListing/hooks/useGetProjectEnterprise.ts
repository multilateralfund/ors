import useApi from '@ors/hooks/useApi'

export function useGetProjectEnterprise(enterprise_id: string) {
  return useApi({
    options: {
      withStoreCache: false,
    },
    path: `api/project-enterprise/${enterprise_id}/`,
  })
}
