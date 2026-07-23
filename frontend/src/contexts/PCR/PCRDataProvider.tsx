import {
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react'

import { useGetPCRDefaults } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRDefaults'
import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { initialOverviewData } from '@ors/components/manage/Blocks/PCR/constants'
import { PCRData } from '@ors/components/manage/Blocks/PCR/interfaces'
import PCRDataContext from './PCRDataContext'
import { useUpdatedFields } from '../Projects/UpdatedFieldsContext'
import useApi from '@ors/hooks/useApi'

import { useParams } from 'wouter'
import { reduce } from 'lodash'

const PCRDataProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { project_id } = useParams<Record<string, string>>()
  const pcrDefaultData = useGetPCRDefaults(project_id)

  const pcrMetaproject = useGetPCRProject(project_id)
  const { data: metaproject } = pcrMetaproject
  const projects = metaproject?.projects ?? []

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

  const fundsByAgency = useMemo(() => {
    const {
      projectAgencyMap,
      mlf_funding_approved,
      total_mlf_funding_approved,
    } = reduce(
      projects,
      (acc, project) => {
        const agencyId = project.agency_id

        acc.projectAgencyMap[project.id] = agencyId

        const fundsApproved = Number(project.funds_approved || 0)

        acc.mlf_funding_approved[agencyId] =
          (acc.mlf_funding_approved[agencyId] || 0) + fundsApproved

        acc.total_mlf_funding_approved += fundsApproved

        return acc
      },
      {
        projectAgencyMap: {} as Record<number, number>,
        mlf_funding_approved: {} as Record<number, number>,
        total_mlf_funding_approved: 0,
      },
    )

    const {
      mlf_funding_disbursed,
      total_mlf_funding_disbursed,
      total_number_of_enterprises,
    } = reduce(
      PCRData.summary_of_key_data,
      (acc, entry) => {
        const agencyId = projectAgencyMap[entry.project_id]

        const fundsDisbursed = Number(entry.funds_disbursed || 0)

        if (agencyId) {
          acc.mlf_funding_disbursed[agencyId] =
            (acc.mlf_funding_disbursed[agencyId] || 0) + fundsDisbursed
        }

        acc.total_mlf_funding_disbursed += fundsDisbursed
        acc.total_number_of_enterprises += entry.enterprises.length

        return acc
      },
      {
        mlf_funding_disbursed: {} as Record<number, number>,
        total_mlf_funding_disbursed: 0,
        total_number_of_enterprises: 0,
      },
    )

    const { mlf_funding_returned, total_mlf_funding_returned } = reduce(
      mlf_funding_approved,
      (acc, fundsApproved, agencyId) => {
        const fundsReturned =
          fundsApproved - (mlf_funding_disbursed[Number(agencyId)] || 0)

        acc.mlf_funding_returned[Number(agencyId)] = fundsReturned
        acc.total_mlf_funding_returned += fundsReturned

        return acc
      },
      {
        mlf_funding_returned: {} as Record<number, number>,
        total_mlf_funding_returned: 0,
      },
    )

    return {
      mlf_funding_approved,
      mlf_funding_disbursed,
      mlf_funding_returned,
      total_mlf_funding_approved,
      total_mlf_funding_disbursed,
      total_mlf_funding_returned,
      total_number_of_enterprises,
    }
  }, [projects, PCRData.summary_of_key_data])

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

  const userTypeOptions = [
    { id: 1, name: 'Cooperating agency' },
    { id: 2, name: 'Government/NOU' },
    { id: 3, name: 'Enterprises' },
    { id: 4, name: 'Consultants' },
    {
      id: 5,
      name: 'Project management officers in the Multilateral Fund Secretariat',
    },
    { id: 6, name: 'Other, please specify' },
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
      pcrDefaultData,
      PCRData,
      setPCRData,
      fundsByAgency,
      financialFiguresTypeOptions,
      projectGoalsAchievedOptions,
      ratingOptions,
      userTypeOptions,
      completionReportDoneByOptions,
      projectComponentOptions,
      causeOfDelayOptions,
      lessonLearnedOptions,
      sdgsOptions,
      projectPhaseOptions,
    }),
    [
      pcrMetaproject,
      pcrDefaultData,
      PCRData,
      setPCRData,
      fundsByAgency,
      financialFiguresTypeOptions,
      projectGoalsAchievedOptions,
      ratingOptions,
      userTypeOptions,
      completionReportDoneByOptions,
      projectComponentOptions,
      causeOfDelayOptions,
      lessonLearnedOptions,
      sdgsOptions,
      projectPhaseOptions,
    ],
  )

  return (
    <PCRDataContext.Provider value={value}>{children}</PCRDataContext.Provider>
  )
}

export default PCRDataProvider
