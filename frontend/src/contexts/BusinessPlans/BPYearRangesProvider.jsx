import { useGetYearRanges } from '@ors/components/manage/Blocks/BusinessPlans/useGetYearRanges'

import BPYearRangesContext from './BPYearRangesContext'

const BPYearRangesProvider = (props) => {
  const { children } = props

  const { loading: yearRangesLoading, results: yearRanges } = useGetYearRanges()

  return (
    <BPYearRangesContext.Provider
      value={{
        yearRanges,
        yearRangesLoading,
      }}
    >
      {children}
    </BPYearRangesContext.Provider>
  )
}

export default BPYearRangesProvider
