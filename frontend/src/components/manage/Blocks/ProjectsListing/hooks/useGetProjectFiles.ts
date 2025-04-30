import useApi from '@ors/hooks/useApi'

export function useGetProjectFiles(project_id: string) {
  return useApi({
    options: {
      withStoreCache: false,
    },
    path: `/api/project/${project_id}/files/v2/`,
  })
}
