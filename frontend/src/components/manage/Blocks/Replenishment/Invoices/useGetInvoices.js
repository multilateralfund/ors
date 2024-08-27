import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export const _PER_PAGE = 50

function useGetInvoices(year) {
  const { data, loaded, loading, setParams } = useApi({
    options: {
      params: {
        ordering: '-date_of_issuance',
        year: year,
      },
      withStoreCache: false,
    },
    path: 'api/replenishment/invoices/',
  })

  if (!data) {
    return {
      count: 0,
      loaded,
      loading,
      results: [],
      setParams,
    }
  }

  return { count: data.length, loaded, loading, results: data, setParams }
}

export default useGetInvoices
