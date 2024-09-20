import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

import { BPGetVersionsInterface } from '../types'

export function useGetBPVersions(props: BPGetVersionsInterface) {
  const { agency_id, year_end, year_start } = props

  const { data, loading } = useApi({
    options: {
      params: {
        agency_id: agency_id,
        direction: 'desc',
        get_versions: true,
        ordering: '-updated_at',
        year_end: year_end,
        year_start: year_start,
      },
    },
    path: `api/business-plan/`,
  })

  const { loaded, results } = getResults(data)

  return { loaded, loading, results }
}
