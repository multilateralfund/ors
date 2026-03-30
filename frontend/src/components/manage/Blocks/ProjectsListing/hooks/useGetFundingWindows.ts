import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'

export function useGetFundingWindows(filters: Record<string, any>) {
  const { data, ...rest } = useApi({
    options: {
      params: filters,
      withStoreCache: false,
    },
    path: 'api/funding-windows',
  })
  // const fundingWindowsResults = getResults(data)
  const fundingWindowsResults = [
    {
      meeting_number: 96,
      decision_number: 96,
      description: 'dana',
      amount: 76.89,
      total_project_funding_approved: 12.99,
      balance: 23.89,
      remarks: 'dana remark',
    },
    {
      meeting_number: 98,
      decision_number: 98,
      description: 'dana2',
      amount: 23.89,
      total_project_funding_approved: 98.99,
      balance: 76.89,
      remarks: 'dana remark 2',
    },
  ]

  return { ...rest, ...fundingWindowsResults }
}
