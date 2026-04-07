import useApi from '@ors/hooks/useApi.ts'
import { getResults } from '@ors/helpers'
import { FundingWindowType } from '@ors/types/api_funding_window.ts'

export const useGetFundingWindow = (withCache: boolean = false) => {
  const { data, ...rest } = useApi<FundingWindowType[]>({
    options: {
      withStoreCache: withCache,
    },
    path: 'api/funding-window/',
  })
  const results = getResults(data)

  return { ...rest, ...results }
}
