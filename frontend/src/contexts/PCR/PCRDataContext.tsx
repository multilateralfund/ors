import { createContext, Dispatch, SetStateAction } from 'react'

import { useGetPCRDefaults } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRDefaults'
import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { useGetPCR } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCR'
import {
  PCRFormData,
  PCROverviewProps,
  OptionsType,
} from '@ors/components/manage/Blocks/PCR/interfaces'
import { ApiSubstance } from '@ors/types/api_substances'

type PCRDataContextProps = PCRFormData & {
  errors: Record<string, any>
  setErrors: Dispatch<SetStateAction<(error: Record<string, any[]>) => void>>
  pcrMetaproject: ReturnType<typeof useGetPCRProject>
  pcrDefaultData: ReturnType<typeof useGetPCRDefaults>
  pcr: ReturnType<typeof useGetPCR>
  agencyIds: number[]
  fundsByAgency: PCROverviewProps
  ratingOptions: OptionsType[]
  entityOptions: OptionsType[]
  completionReportDoneByOptions: OptionsType[]
  substanceOptions: (ApiSubstance & { label: string })[]
  delayClusterOptions: OptionsType[]
  rootCauseOfDelayOptions: OptionsType[]
  lessonLearnedOptions: OptionsType[]
  sdgsOptions: OptionsType[]
  fileSectionOptions: OptionsType[]
}

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
