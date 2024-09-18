import { ApiBP } from '@ors/types/api_bp_get'

import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export function useGetBPDiff(business_plan: ApiBP) {
  const {
    id: business_plan_id,
    agency,
    version,
    year_end,
    year_start,
  } = business_plan
  const { id: agency_id } = agency || {}

  const { data, loading } = useApi({
    options: {
      params: {
        ...{
          agency_id,
          business_plan_id,
          version,
          year_end,
          year_start,
        },
      },
    },
    path: `api/business-plan/activities/diff/`,
  })

  const { results } = getResults(data)

  return { loading, results }
}
