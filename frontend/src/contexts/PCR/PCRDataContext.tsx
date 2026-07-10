import { createContext } from 'react'

import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { PCRFormData } from '@ors/components/manage/Blocks/PCR/interfaces'

type PCRDataContextProps = PCRFormData & {
  pcrMetaproject: ReturnType<typeof useGetPCRProject>
}

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
