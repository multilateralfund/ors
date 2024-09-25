import { ApiReplenishmentInvoices } from '@ors/types/api_replenishment_invoices'

import useApi from '@ors/hooks/useApi'

function useGetInvoices(year: number) {
  const { data, loaded, loading, params, setParams } =
    useApi<ApiReplenishmentInvoices>({
      options: {
        params: {
          hide_no_invoice: true,
          ordering: 'country',
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
      params,
      results: [],
      setParams,
    }
  }

  return { loaded, loading, params, results: data, setParams }
}

export default useGetInvoices
