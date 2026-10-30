import {
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react'

import { useGetPCRDefaults } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRDefaults'
import { useGetPCRVersions } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRVersions'
import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { useGetPCR } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCR'
import {
  initialOverviewData,
  summaryOfKeyDataField,
  ppField,
  sdgsContributionField,
  sdgsField,
  sdgAgencyErrorsField,
  supportingEvidencesField,
  evidencesField,
  cdField,
  llField,
} from '@ors/components/manage/Blocks/PCR/constants'
import {
  PCRData,
  PCRResultsAssessmentData,
  PCRCausesOfDelayData,
  PCRLessonsLearnedData,
  PCRGenderMainstreamingData,
  PCRSdgsData,
  PCRSupportingEvidencesData,
} from '@ors/components/manage/Blocks/PCR/interfaces'
import {
  formatAgencyData,
  formatOptions,
  alignSummaryOfKeyDataErrors,
} from '@ors/components/manage/Blocks/PCR/utils'
import PCRDataContext from './PCRDataContext'
import { useUpdatedFields } from '../Projects/UpdatedFieldsContext'
import useApi from '@ors/hooks/useApi'
import { ApiSubstance } from '@ors/types/api_substances'

import { useParams } from 'wouter'
import {
  compact,
  filter,
  forEach,
  groupBy,
  isEmpty,
  keys,
  map,
  omit,
  pick,
  reduce,
  uniq,
} from 'lodash'

const PCRDataProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { pcr_id, project_id } = useParams<Record<string, string>>()
  const pcrDefaultData = useGetPCRDefaults(project_id)
  const pcr = useGetPCR(pcr_id)
  const pcrVersions = useGetPCRVersions(pcr_id)

  const pcrMetaproject = useGetPCRProject(project_id)
  const { data: metaproject } = pcrMetaproject
  const projects = metaproject?.projects ?? []

  const agencyIds = useMemo(
    () =>
      uniq(
        compact([metaproject?.lead_agency_id, ...map(projects, 'agency_id')]),
      ),
    [metaproject],
  )

  const { addUpdatedField } = useUpdatedFields()

  const [PCRData, setPCRDataNoFieldTracking] = useState<PCRData>({
    overview: initialOverviewData,
    summary_of_key_data: [],
    results_assessment: [],
    delay_causes: [],
    learned_lessons: [],
    future_project_recommendations: [],
    gender_mainstreaming: [],
    sdgs_contribution: [],
    supporting_evidences: [],
  })
  const [initialErrors, setInitialErrors] = useState({})

  const setErrors = useCallback(
    (updater: any) => {
      setInitialErrors(
        typeof updater === 'function'
          ? updater
          : alignSummaryOfKeyDataErrors(updater, PCRData.summary_of_key_data),
      )
    },
    [PCRData.summary_of_key_data],
  )

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

  const formatSummaryOfKeyData = (errors: Record<string, any[]>) => {
    const summaryOfKeyData = PCRData.summary_of_key_data || []

    const projectErrors = map(summaryOfKeyData, (data, index) => ({
      project_id: data.project_id,
      errors: errors?.[summaryOfKeyDataField]?.[index] ?? {},
    }))

    return { [summaryOfKeyDataField]: groupBy(projectErrors, 'project_id') }
  }

  const formatResultsAssessmentErrors = (errors: Record<string, any[]>) => {
    const resultsAssessmentData = formatAgencyData<PCRResultsAssessmentData>(
      PCRData.results_assessment || [],
      'overall_assessment_highlights',
    )

    const agenciesErrors = map(resultsAssessmentData, (data, index) => ({
      agency_id: data.agency_id,
      errors: errors?.overall_assessment_highlights?.[index] ?? {},
    }))

    return {
      overall_assessment_highlights: groupBy(agenciesErrors, 'agency_id'),
    }
  }

  // const formatProjectComponentsErrors = (errors: Record<string, any[]>) => {
  //   let crtErrorIndex = 0

  //   const formatAgencyErrors = (
  //     data: (PCRCausesOfDelayData | PCRLessonsLearnedData)[],
  //   ) =>
  //     groupBy(
  //       map(
  //         filter(data || [], (entry) => entry.project_components.length > 0),
  //         ({ agency_id, project_components }) => ({
  //           agency_id,
  //           errors: map(project_components, () => {
  //             const pcErrors = errors?.project_components?.[crtErrorIndex] ?? {}
  //             crtErrorIndex++

  //             return pcErrors
  //           }),
  //         }),
  //       ),
  //       'agency_id',
  //     )

  //   const causesOfDelayErrors = formatAgencyErrors(PCRData.delay_causes)
  //   const lessonsLearnedErrors = formatAgencyErrors(PCRData.learned_lessons)

  //   return {
  //     delay_causes: { project_components: causesOfDelayErrors },
  //     learned_lessons: { project_components: lessonsLearnedErrors },
  //   }
  // }

  const formatCausesOfDelayErrors = (errors: Record<string, any[]>) => {
    const dcData = formatAgencyData<PCRCausesOfDelayData>(
      PCRData.delay_causes || [],
      cdField,
    )

    const agenciesErrors = map(dcData, (data, index) => ({
      agency_id: data.agency_id,
      errors: errors?.[cdField]?.[index] ?? {},
    }))

    return { [cdField]: groupBy(agenciesErrors, 'agency_id') }
  }

  const formatLessonsLearnedErrors = (errors: Record<string, any[]>) => {
    const llData = formatAgencyData<PCRLessonsLearnedData>(
      PCRData.learned_lessons || [],
      llField,
    )

    const agenciesErrors = map(llData, (data, index) => ({
      agency_id: data.agency_id,
      errors: errors?.[llField]?.[index] ?? {},
    }))

    return { [llField]: groupBy(agenciesErrors, 'agency_id') }
  }

  const formatGenderMainstreamingErrors = (errors: Record<string, any[]>) => {
    const genderMainstreamingData =
      formatAgencyData<PCRGenderMainstreamingData>(
        PCRData.gender_mainstreaming || [],
        ppField,
      )

    const agenciesErrors = map(genderMainstreamingData, (data, index) => ({
      agency_id: data.agency_id,
      errors: errors?.[ppField]?.[index] ?? {},
    }))

    return { [ppField]: groupBy(agenciesErrors, 'agency_id') }
  }

  const formatSDGsErrors = (errors: Record<string, any[]>) => {
    const pcrSdgs = PCRData.sdgs_contribution || []
    const filteredSdgs = filter(
      pcrSdgs,
      (sdg) => sdg.goals.length > 0 || !sdg.sdg_applying,
    )

    const formattedErrors = reduce(
      filteredSdgs,
      (acc: Record<string, any>[], entry, index) => {
        forEach(entry[sdgsField] as object[], (_, subEntryIndex) => {
          const crtAgencyErrors = errors?.[sdgsContributionField]?.[index]

          acc.push(crtAgencyErrors?.[sdgsField]?.[subEntryIndex] ?? {})
        })

        return acc
      },
      [],
    )

    const sdgsData = formatAgencyData<PCRSdgsData>(pcrSdgs, sdgsField)

    const agenciesErrors = map(sdgsData, (data, index) => ({
      agency_id: data.agency_id,
      errors: formattedErrors?.[index] ?? {},
    }))

    const agencyLevelErrors = reduce(
      filteredSdgs,
      (acc: Record<string, any[]>, entry, index) => {
        const crtAgencyErrors = omit(
          errors?.[sdgsContributionField]?.[index],
          sdgsField,
        )

        if (!isEmpty(crtAgencyErrors)) {
          acc[entry.agency_id] = [
            { agency_id: entry.agency_id, errors: crtAgencyErrors },
          ]
        }

        return acc
      },
      {},
    )

    return {
      [sdgsContributionField]: groupBy(agenciesErrors, 'agency_id'),
      [sdgAgencyErrorsField]: agencyLevelErrors,
    }
  }

  const formatEvidencesErrors = (errors: Record<string, any[]>) => {
    const evidencesData = formatAgencyData<PCRSupportingEvidencesData>(
      PCRData.supporting_evidences || [],
      evidencesField,
    )

    const agenciesErrors = map(evidencesData, (data, index) => ({
      agency_id: data.agency_id,
      errors: errors?.[supportingEvidencesField]?.[index] ?? {},
    }))

    return { [supportingEvidencesField]: groupBy(agenciesErrors, 'agency_id') }
  }

  const groupErrors = (errors: Record<string, any[]>) => {
    const overviewFields = keys(initialOverviewData)
    const overviewErrors = pick(errors, overviewFields)
    const summaryOfKeyDataErrors = formatSummaryOfKeyData(
      pick(errors, summaryOfKeyDataField),
    )
    const resultsAssessmentErrors = formatResultsAssessmentErrors(
      pick(errors, 'overall_assessment_highlights'),
    )
    // const projectComponentsErrors = formatProjectComponentsErrors(
    //   pick(errors, 'project_components'),
    // )
    const causesOfDelayErrors = formatCausesOfDelayErrors(
      pick(errors, 'delay_causes'),
    )
    const lessonsLearnedErrors = formatLessonsLearnedErrors(
      pick(errors, 'learned_lessons'),
    )
    const genderMainstreamingErrors = formatGenderMainstreamingErrors(
      pick(errors, ppField),
    )
    const sdgsErrors = formatSDGsErrors(pick(errors, sdgsContributionField))
    const evidencesErrors = formatEvidencesErrors(
      pick(errors, supportingEvidencesField),
    )

    return {
      overview: overviewErrors,
      summary_of_key_data: summaryOfKeyDataErrors,
      results_assessment: resultsAssessmentErrors,
      delay_causes: causesOfDelayErrors,
      learned_lessons: lessonsLearnedErrors,
      gender_mainstreaming: genderMainstreamingErrors,
      sdgs_contribution: sdgsErrors,
      supporting_evidences: evidencesErrors,
    }
  }

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

        const filteredEnterprises = filter(
          entry.enterprises,
          (enterprise) => !enterprise.isDefault,
        )

        acc.total_mlf_funding_disbursed += fundsDisbursed
        acc.total_number_of_enterprises += filteredEnterprises.length

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

  const { data: substances = [] } = useApi<ApiSubstance[]>({
    options: { withStoreCache: true },
    path: 'api/substances/',
  })

  const substanceOptions = useMemo(
    () =>
      [...(substances ?? [])]
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((substance) => ({ ...substance, label: substance.name })),
    [substances],
  )

  const { data: delayClusterOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-reports/delay-cluster-options/',
  })

  const { data: rootCauseOfDelayOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-reports/root-causes-of-delay-options/',
  })

  const { data: lessonLearnedOptions } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-completion-reports/learned-lesson-categories/',
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
      pcr,
      pcrVersions,
      pcrMetaproject,
      agencyIds,
      pcrDefaultData,
      PCRData,
      setPCRData,
      errors,
      setErrors,
      fundsByAgency,
      ratingOptions,
      entityOptions,
      completionReportDoneByOptions,
      substanceOptions,
      delayClusterOptions,
      rootCauseOfDelayOptions,
      lessonLearnedOptions,
      sdgsOptions,
      fileSectionOptions,
    }),
    [
      pcr,
      pcrVersions,
      pcrMetaproject,
      agencyIds,
      pcrDefaultData,
      PCRData,
      setPCRData,
      errors,
      setErrors,
      fundsByAgency,
      ratingOptions,
      entityOptions,
      completionReportDoneByOptions,
      substanceOptions,
      delayClusterOptions,
      rootCauseOfDelayOptions,
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
