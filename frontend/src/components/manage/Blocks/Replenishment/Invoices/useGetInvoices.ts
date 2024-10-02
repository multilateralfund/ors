import { ApiReplenishmentInvoices } from '@ors/types/api_replenishment_invoices'

import useApi from '@ors/hooks/useApi'

interface useGetInvoicesOptions {
  country_id?: string
  hide_no_invoice?: boolean
  ordering?: string
  year_max?: number
  year_min?: number
}

function useGetInvoices(options: useGetInvoicesOptions) {
  const { hide_no_invoice = true, ordering = 'country', ...rest } = options
  const { data, loaded, loading, params, setParams } =
    useApi<ApiReplenishmentInvoices>({
      options: {
        params: {
          ...rest,
          hide_no_invoice,
          ordering,
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
