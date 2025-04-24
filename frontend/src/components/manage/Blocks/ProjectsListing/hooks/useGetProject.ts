import useApi from '@ors/hooks/useApi'

export function useGetProject(project_id: string) {
  return useApi({
    options: {
      withStoreCache: false,
    },
    path: `api/projects/${project_id}/`,
  })
}
