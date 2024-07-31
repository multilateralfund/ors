import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

const BP_PER_PAGE = 20

export function useGetActivities(period: string) {
  const { periodOptions } = useGetBpPeriods()

  const firstPeriod = periodOptions[periodOptions.length - 1].value
  const lastPeriod = periodOptions[0].value

  const year_end = period?.split('-')[1] || lastPeriod.split('-')[1]
  const year_start = period?.split('-')[0] || firstPeriod.split('-')[0]

  const { data, loading, setParams } = useApi({
    options: {
      params: {
        limit: BP_PER_PAGE,
        offset: 0,
        year_end: year_end,
        year_start: year_start,
      },
      withStoreCache: false,
    },
    path: 'api/business-plan-record/',
  })
  const { count, loaded, results } = getResults(data)

  return { loaded, loading, results, setParams }
}
