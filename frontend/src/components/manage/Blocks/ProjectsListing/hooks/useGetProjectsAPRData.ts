import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'

export function useGetProjectsAPRData(
  project_id: string | number,
  mode: string,
) {
  const { data, ...rest } = useApi({
    options: {
      withStoreCache: false,
      triggerIf: ['edit', 'view'].includes(mode),
    },
    path: `/api/projects/v2/${project_id}/apr-history/`,
  })
  const aprDataResults = getResults(data)

  return { ...rest, ...aprDataResults }
}
