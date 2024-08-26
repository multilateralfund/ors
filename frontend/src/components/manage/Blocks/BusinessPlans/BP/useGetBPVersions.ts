import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export function useGetBPVersions(businessPlan: any) {
  const { agency, year_end, year_start } = businessPlan
  const { id } = agency || {}

  const { data, loading } = useApi({
    options: {
      params: {
        direction: 'desc',
        ordering: '-updated_at',
      },
    },
    path: `api/business-plan/?agency_id=${id}&year_start=${year_start}&year_end=${year_end}&get_versions=true`,
  })

  const { results } = getResults(data)

  return { loading, results }
}
