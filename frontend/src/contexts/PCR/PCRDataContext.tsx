import { createContext } from 'react'

import { PCRStatus } from '@ors/components/manage/Blocks/PCR/interfaces'

interface PCRDataContextProps {
  statuses: PCRStatus[]
}

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
