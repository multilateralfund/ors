import { ApiReplenishmentSoCStatistic } from '@ors/types/api_replenishment_soc_statistics'

import { floorSmallValue } from '@ors/components/manage/Blocks/Replenishment/utils'
import useApi from '@ors/hooks/useApi'

export interface SoCStatistic extends ApiReplenishmentSoCStatistic {
  outstanding_contributions_percentage: number
  period: string
}

function useGetStatisticsData() {
  const { data, loading, setParams } = useApi<SoCStatistic[]>({
    options: {},
    path: '/api/replenishment/status-of-contributions/statistics/',
  })

  if (data) {
    for (let i = 0; i < data.length; i++) {
      data[i].period = `${data[i].start_year}-${data[i].end_year}`
      data[i].promissory_notes = floorSmallValue(data[i].promissory_notes)
      data[i].outstanding_contributions_percentage =
        (data[i].outstanding_contributions / data[i].agreed_contributions) * 100
    }
  }

  return { data, invalidateDataFn: setParams, loading }
}

export default useGetStatisticsData
