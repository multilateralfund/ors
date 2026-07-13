import { createContext } from 'react'

import { PCRStatus } from '@ors/components/manage/Blocks/PCR/interfaces'
import { Country } from '@ors/types/store'

interface PCRDataContextProps {
  statuses: PCRStatus[]
  regions: Country[]
}

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
