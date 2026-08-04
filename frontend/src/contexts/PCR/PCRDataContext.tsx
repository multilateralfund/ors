import { createContext } from 'react'

import { useGetPCRDefaults } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRDefaults'
import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import {
  PCRFormData,
  PCROverviewProps,
  OptionsType,
  PCRFilesInterface,
  PCRFileMetadataInterface,
} from '@ors/components/manage/Blocks/PCR/interfaces'

type PCRDataContextProps = PCRFormData &
  PCRFilesInterface &
  PCRFileMetadataInterface & {
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
    projectPhaseOptions: OptionsType[]
    fileSectionOptions: OptionsType[]
  }

const PCRDataContext = createContext<PCRDataContextProps>(
  null as unknown as PCRDataContextProps,
)

export default PCRDataContext
