import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export const _PER_PAGE = 2

function useGetInvoices(filters) {
  const { data, loading, setParams } = useApi({
    options: {
      params: {
        limit: _PER_PAGE,
        offset: 0,
        // ordering: '-created_at',
        // status: filters.status,
        // ...(filters.range.length === 2
        //   ? {
        //       year_max: filters.range[1],
        //       year_min: filters.range[0],
        //     }
        //   : {}),
      },
      withStoreCache: false,
    },
    path: 'api/replenishment/invoices/',
  })
  const { count, loaded, results } = getResults(data)
  return { count, data, loaded, loading, results, setParams }
}

export default useGetInvoices
