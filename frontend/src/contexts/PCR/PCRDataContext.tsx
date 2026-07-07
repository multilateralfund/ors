import { createContext } from 'react'

import {
  PCRFormData,
  PCRStatus,
} from '@ors/components/manage/Blocks/PCR/interfaces'

type PCRDataContextProps = PCRFormData & {
  statuses: PCRStatus[]
}

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
