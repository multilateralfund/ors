import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export const _PER_PAGE = 50

function useGetInvoices() {
  const { data, loading, setParams } = useApi({
    options: {
      params: {
        limit: _PER_PAGE,
        offset: 0,
        ordering: '-date_of_issuance',
      },
      withStoreCache: false,
    },
    path: 'api/replenishment/invoices/',
  })
  const { count, loaded, results } = getResults(data)
  return { count, data, loaded, loading, results, setParams }
}

export default useGetInvoices
