import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'

export function useGetEnterprises(
  filters: Record<string, any>,
  country_id?: number | null,
) {
  const { data, ...rest } = useApi({
    options: {
      params: { ...filters, country_id },
      withStoreCache: false,
    },
    path: 'api/enterprises',
  })
  const enterpriseResults = getResults(data)

  return { ...rest, ...enterpriseResults }
}
