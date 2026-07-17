import {
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react'

import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { initialOverviewData } from '@ors/components/manage/Blocks/PCR/constants'
import { PCRData } from '@ors/components/manage/Blocks/PCR/interfaces'
import PCRDataContext from './PCRDataContext'
import { useUpdatedFields } from '../Projects/UpdatedFieldsContext'
import useApi from '@ors/hooks/useApi'

import { useParams } from 'wouter'

const PCRDataProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { project_id } = useParams<Record<string, string>>()
  const pcrMetaproject = useGetPCRProject(project_id)

  const { addUpdatedField } = useUpdatedFields()

  const [PCRData, setPCRDataNoFieldTracking] = useState<PCRData>({
    overview: initialOverviewData,
    summary_of_key_data: [],
    results_assessment: [],
    causes_of_delay: [],
    lessons_learned: [],
    gender_mainstreaming: [],
    sdgs_contribution: [],
  })

  const setPCRData = useCallback(
    (updater: SetStateAction<PCRData>, fieldName?: string) => {
      if (fieldName) {
        addUpdatedField(fieldName)
      }

      setPCRDataNoFieldTracking((prevData) =>
        typeof updater === 'function'
          ? (updater as (prev: PCRData) => PCRData)(prevData)
          : updater,
      )
    },
    [addUpdatedField],
  )

  const { data: projectComponentOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-reports/project-component-options/',
  })

  const { data: causeOfDelayOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-reports/delay-categories/',
  })

  const { data: lessonLearnedOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-reports/learned-lesson-categories/',
  })

  //to update
  const financialFiguresTypeOptions = [
    { id: 1, name: 'Provisional' },
    { id: 2, name: 'Final' },
  ]

  const projectGoalsAchievedOptions = [
    { id: 1, name: 'Yes' },
    { id: 2, name: 'No' },
    { id: 3, name: 'N/A' },
  ]

  const ratingOptions = [
    { id: 1, name: 'Highly satisfactory' },
    { id: 2, name: 'Satisfactory as planned' },
    { id: 3, name: 'Satisfactory but not as planned' },
    { id: 4, name: 'Unsatisfactory' },
    { id: 5, name: 'Other, please specify' },
  ]

  const completionReportDoneByOptions = [
    { id: 1, name: 'Lead agency' },
    { id: 2, name: 'Cooperating agency' },
    { id: 3, name: 'National coordinating agency/NOU' },
    { id: 4, name: 'Local executing agency' },
    { id: 5, name: 'Other' },
  ]

  const sdgsOptions = [
    { id: 1, name: 'Goal 1: No poverty' },
    { id: 2, name: 'Goal 2: Zero hunger' },
    { id: 3, name: 'Goal 3: Good health and well being' },
    { id: 4, name: 'Goal 4: Quality education' },
    { id: 5, name: 'Goal 5: Gender equality' },
    { id: 6, name: 'Goal 6: Clean water and sanitation' },
    { id: 7, name: 'Goal 7: Affordable and clean energy' },
    { id: 8, name: 'Goal 8: Decent work and economic growth' },
    { id: 9, name: 'Goal 9: Industry, innovation and infrastucture' },
    { id: 10, name: 'Goal 10: Reduced inequalities' },
    { id: 11, name: 'Goal 11: Sustainable cities and communities' },
    { id: 12, name: 'Goal 12: Responsible consumption and production' },
    { id: 13, name: 'Goal 13: Climate action' },
    { id: 14, name: 'Goal 14: Life below water' },
    { id: 15, name: 'Goal 15: Life on land' },
    { id: 16, name: 'Goal 16: Peace, justice and strong institutions' },
    { id: 17, name: 'Goal 17: Partnerships for the goals' },
  ]

  const projectPhaseOptions = [
    { id: 1, name: 'Project preparation' },
    { id: 2, name: 'Planning/Formulation' },
    { id: 3, name: 'Implementation' },
    { id: 4, name: 'Monitoring and Reporting' },
  ]

  const value = useMemo(
    () => ({
      pcrMetaproject,
      PCRData,
      setPCRData,
      financialFiguresTypeOptions,
      projectComponentOptions,
      causeOfDelayOptions,
      lessonLearnedOptions,
      sdgsOptions,
      projectPhaseOptions,
      completionReportDoneByOptions,
      projectGoalsAchievedOptions,
      ratingOptions,
    }),
    [
      pcrMetaproject,
      PCRData,
      setPCRData,
      financialFiguresTypeOptions,
      projectComponentOptions,
      causeOfDelayOptions,
      lessonLearnedOptions,
      sdgsOptions,
      projectPhaseOptions,
      completionReportDoneByOptions,
      projectGoalsAchievedOptions,
      ratingOptions,
    ],
  )

  return (
    <PCRDataContext.Provider value={value}>{children}</PCRDataContext.Provider>
  )
}

export default PCRDataProvider
