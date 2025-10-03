import useApi from '@ors/hooks/useApi'
import { map } from 'lodash'

export function useGetEnterpriseStatuses(include_obsolete = true) {
  const { data } = useApi({
    options: {
      params: { include_obsolete },
      withStoreCache: true,
    },
    path: '/api/project-enterprise-status/',
  })

  return map(data, (status) => ({
    id: status[0],
    name: status[1],
  }))
}
