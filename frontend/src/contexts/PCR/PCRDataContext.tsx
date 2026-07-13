import { createContext } from 'react'

import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { PCRFormData } from '@ors/components/manage/Blocks/PCR/interfaces'
import { Country } from '@ors/types/store'

type PCRDataContextProps = PCRFormData & {
  pcrMetaproject: ReturnType<typeof useGetPCRProject>
  regions: Country[]
}

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
