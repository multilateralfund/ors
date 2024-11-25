import { createContext } from 'react'

import { BPYearRangesContextType } from './types'

const BPYearRangesContext = createContext<BPYearRangesContextType>(
  null as unknown as BPYearRangesContextType,
)

export default BPYearRangesContext
