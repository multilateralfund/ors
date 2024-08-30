import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

export const useGetYearRanges = () => {
  const { data, loading } = useApi({
    options: {},
    path: 'api/business-plan/get-years/',
  })
  const { loaded, results } = getResults(data)

  return { loaded, loading, results }
}
