import { ApiBPChemicalType } from '@ors/types/api_bp_get'

import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export const useGetChemicalTypes = () => {
  const { data, loading } = useApi<Array<ApiBPChemicalType>>({
    options: {},
    path: 'api/business-plan/bp-chemical-types/',
  })
  const { loaded, results } = getResults(data)

  return { loaded, loading, results }
}
