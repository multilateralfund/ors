import useApi from '@ors/hooks/useApi'

export function useGetProjectSettings() {
  return useApi({
    options: {
      withStoreCache: false,
    },
    path: 'api/project-settings/',
  })
}
