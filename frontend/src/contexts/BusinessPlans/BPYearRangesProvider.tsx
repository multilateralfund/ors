import { useStore } from '@ors/store'
import BPYearRangesContext from './BPYearRangesContext'
import { BPYearRangesProviderProps } from './types'

const BPYearRangesProvider = (props: BPYearRangesProviderProps) => {
  const { children } = props

  const {
    loading: yearRangesLoading,
    data: yearRanges,
    loaded: yearRangesLoaded,
  } = useStore((state) => state.yearRanges.yearRanges)

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
