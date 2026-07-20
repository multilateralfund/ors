import { createContext } from 'react'

import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import {
  PCRFormData,
  OptionsType,
} from '@ors/components/manage/Blocks/PCR/interfaces'

type PCRDataContextProps = PCRFormData & {
  pcrMetaproject: ReturnType<typeof useGetPCRProject>
  financialFiguresTypeOptions: OptionsType[]
  projectGoalsAchievedOptions: OptionsType[]
  ratingOptions: OptionsType[]
  userTypeOptions: OptionsType[]
  completionReportDoneByOptions: OptionsType[]
  projectComponentOptions: OptionsType[]
  causeOfDelayOptions: OptionsType[]
  lessonLearnedOptions: OptionsType[]
  sdgsOptions: OptionsType[]
  projectPhaseOptions: OptionsType[]
}

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
