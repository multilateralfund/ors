import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export function useGetBPVersions(businessPlan: any) {
  const { agency, year_end, year_start } = businessPlan
  const { id } = agency || {}

  const { data, loading } = useApi({
    options: {
      params: {
        agency_id: id,
        direction: 'desc',
        get_versions: true,
        ordering: '-updated_at',
        year_end: year_end,
        year_start: year_start,
      },
    },
    path: `api/business-plan/`,
  })

  const { results } = getResults(data)

  return { loading, results }
}
