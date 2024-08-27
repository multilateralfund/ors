import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export const _PER_PAGE = 50

function useGetInvoices(year) {
  const { data, loaded, loading, setParams } = useApi({
    options: {
      params: {
        hide_no_invoice: true,
        ordering: "country",
        year: year,
      },
      withStoreCache: false,
    },
    path: 'api/replenishment/invoices/',
  })

  if (!data) {
    return {
      loaded,
      loading,
      results: [],
      setParams,
    }
  }

  return { loaded, loading, results: data, setParams }
}

export default useGetInvoices
