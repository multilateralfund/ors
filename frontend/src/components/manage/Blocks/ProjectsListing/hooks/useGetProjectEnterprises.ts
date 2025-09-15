import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'
import { PEnterpriseType } from '../interfaces'

export function useGetProjectEnterprises(filters: Record<string, any>) {
  const { data, ...rest } = useApi<PEnterpriseType[]>({
    options: {
      params: filters,
      withStoreCache: false,
    },
    path: '/api/project-enterprise',
  })
  const enterprisesResult = getResults(data)

  return { ...rest, ...enterprisesResult }
}
