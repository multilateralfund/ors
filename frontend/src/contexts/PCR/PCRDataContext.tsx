import { createContext, Dispatch, SetStateAction } from 'react'

import { useGetPCRDefaults } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRDefaults'
import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import {
  PCRFormData,
  PCROverviewProps,
  OptionsType,
} from '@ors/components/manage/Blocks/PCR/interfaces'

type PCRDataContextProps = PCRFormData & {
  errors: Record<string, any>
  setErrors: Dispatch<SetStateAction<(error: Record<string, any[]>) => void>>
  pcrMetaproject: ReturnType<typeof useGetPCRProject>
  pcrDefaultData: ReturnType<typeof useGetPCRDefaults>
  fundsByAgency: PCROverviewProps
  ratingOptions: OptionsType[]
  entityOptions: OptionsType[]
  completionReportDoneByOptions: OptionsType[]
  projectComponentOptions: OptionsType[]
  causeOfDelayOptions: OptionsType[]
  lessonLearnedOptions: OptionsType[]
  sdgsOptions: OptionsType[]
  fileSectionOptions: OptionsType[]
}

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
