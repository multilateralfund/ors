import useApi from '@ors/hooks/useApi'

function useGetStatisticsData() {
  const { data, loading, setParams } = useApi({
    options: {},
    path: '/api/replenishment/status-of-contributions/statistics/',
  })

  if (data) {
    for (let i = 0; i < data.length; i++) {
      data[i].period = `${data[i].start_year}-${data[i].end_year}`
      data[i].outstanding_contributions_percentage =
        (data[i].outstanding_contributions / data[i].agreed_contributions) * 100
    }
  }

  return { data, invalidateDataFn: setParams, loading }
}

export default useGetStatisticsData
