import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

import { BPGetDiffInterface } from '../types'

export function useGetBPDiff(props: BPGetDiffInterface) {
  const { agency_id, version, year_end, year_start } = props

  const { data, loading } = useApi({
    options: {
      params: {
        ...{
          agency_id,
          version,
          year_end,
          year_start,
        },
      },
    },
    path: `api/business-plan/activities/diff/`,
  })

  const { loaded, results } = getResults(data)

  return { loaded, loading, results }
}
