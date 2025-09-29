import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { PEnterpriseType } from '../interfaces'

export function useGetProjectEnterprises(project_id: string) {
  const params = {
    offset: 0,
    limit: 100,
    project_id: project_id,
  }

  const { data, ...rest } = useApi<PEnterpriseType[]>({
    options: {
      params: params,
      withStoreCache: false,
    },
    path: '/api/project-enterprise',
  })
  const enterprisesResult = getResults(data)

  return { ...rest, ...enterprisesResult }
}
