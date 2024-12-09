import { useGetYearRanges } from '@ors/components/manage/Blocks/BusinessPlans/useGetYearRanges'

import BPYearRangesContext from './BPYearRangesContext'
import { BPYearRangesProviderProps } from './types'

const BPYearRangesProvider = (props: BPYearRangesProviderProps) => {
  const { children } = props

  const {
    loading: yearRangesLoading,
    results: yearRanges,
    loaded: yearRangesLoaded,
  } = useGetYearRanges()

  return (
    <BPYearRangesContext.Provider
      value={{
        yearRanges,
        yearRangesLoading,
        yearRangesLoaded,
      }}
    >
      {children}
    </BPYearRangesContext.Provider>
  )
}

export default BPYearRangesProvider
