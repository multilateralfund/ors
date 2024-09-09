import { ApiReplenishmentPayments } from '@ors/types/api_replenishment_payments'

import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export const _PER_PAGE = 50

function useGetPayments() {
  const { data, loading, setParams } = useApi<ApiReplenishmentPayments>({
    options: {
      params: {
        limit: _PER_PAGE,
        offset: 0,
        ordering: '-date',
      },
      withStoreCache: false,
    },
    path: 'api/replenishment/payments/',
  })
  const { count, loaded, results } = getResults(data)
  return { count, data, loaded, loading, results, setParams }
}

export default useGetPayments
