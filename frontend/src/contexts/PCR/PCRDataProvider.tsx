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
import {
  formatOptions,
  groupErrors,
} from '@ors/components/manage/Blocks/PCR/utils'
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
    supporting_evidences: [],
  })
  const [initialErrors, setErrors] = useState({})

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

  const errors = useMemo(() => groupErrors(initialErrors), [initialErrors])

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

  const { data: ratings } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-report/rating/',
  })
  const ratingOptions = formatOptions(ratings)

  const { data: entities } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-report/entity/',
  })
  const entityOptions = formatOptions(entities)

  const { data: completedBy } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-report/completed-by/',
  })
  const completionReportDoneByOptions = formatOptions(completedBy)

  const { data: projectComponentOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-report/project-component-option/',
  })

  const { data: causeOfDelayOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-report/delay-category/',
  })

  const { data: lessonLearnedOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-report/learned-lesson-category/',
  })

  const { data: sdgsOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-report/goal/',
  })

  const { data: fileSectionOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-report/supporting-evidence-section/',
  })

  const value = useMemo(
    () => ({
      pcrMetaproject,
      pcrDefaultData,
      PCRData,
      setPCRData,
      errors,
      setErrors,
      fundsByAgency,
      ratingOptions,
      entityOptions,
      completionReportDoneByOptions,
      projectComponentOptions,
      causeOfDelayOptions,
      lessonLearnedOptions,
      sdgsOptions,
      fileSectionOptions,
    }),
    [
      pcrMetaproject,
      pcrDefaultData,
      PCRData,
      setPCRData,
      errors,
      setErrors,
      fundsByAgency,
      ratingOptions,
      entityOptions,
      completionReportDoneByOptions,
      projectComponentOptions,
      causeOfDelayOptions,
      lessonLearnedOptions,
      sdgsOptions,
      fileSectionOptions,
    ],
  )

  return (
    <PCRDataContext.Provider value={value}>{children}</PCRDataContext.Provider>
  )
}

export default PCRDataProvider
