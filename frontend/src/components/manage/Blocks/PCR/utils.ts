import {
  pcrFieldsMapping,
  pcrFieldsErrorsMapping,
  requiredMessage,
  validWordCountMessage,
} from './constants'
import {
  PCRData,
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCREquipmentType,
  PCRSummaryOfKeyDataType,
  PCRResultsAssessmentData,
  CauseOfDelayProjectComponent,
  LessonLearnedProjectComponent,
  PCRGenderMainstreamingData,
  OptionsType,
} from './interfaces'
import { useGetPCRDefaults } from './hooks/useGetPCRDefaults'
import { ApiAgency } from '@ors/types/api_agencies'

import {
  filter,
  find,
  findIndex,
  flatMap,
  forEach,
  lowerCase,
  map,
  omit,
  pick,
  reduce,
  some,
  sumBy,
} from 'lodash'

export type PCRSummaryProjectPayload = {
  project_id: number
  funds_disbursed?: string
  planned_date_of_completion?: string
  alternative_technologies?: PCRAlternativeTechnologyType[]
  enterprises?: PCREnterpriseType[]
  equipments?: PCREquipmentType[]
}

const hasText = (value: string) => value.trim() !== ''

const cleanNumber = (value: string) => {
  const cleanedValue = value.replace(/,/g, '').trim()
  return cleanedValue || undefined
}

const cleanDate = (value: string) => value.trim() || undefined

const cleanAlternativeTechnologies = (
  entries: PCRAlternativeTechnologyType[],
) =>
  entries.filter(
    (entry) => entry.substance_from !== null || entry.substance_to !== null,
  )

const cleanEnterprises = (entries: PCREnterpriseType[]) =>
  entries
    .map((entry) => ({
      name: entry.name.trim(),
      address: entry.address.trim(),
    }))
    .filter((entry) => hasText(entry.name) || hasText(entry.address))

const cleanEquipments = (entries: PCREquipmentType[]) =>
  entries
    .map((entry) => ({
      name: entry.name.trim(),
      description: entry.description.trim(),
      disposal_type: entry.disposal_type,
      disposal_date: entry.disposal_date,
    }))
    .filter(
      (entry) =>
        hasText(entry.name) ||
        hasText(entry.description) ||
        entry.disposal_type !== null ||
        hasText(entry.disposal_date),
    )

export const buildPCRProjectPayload = (
  entry: PCRSummaryOfKeyDataType,
): PCRSummaryProjectPayload => {
  const payload: PCRSummaryProjectPayload = {
    project_id: entry.project_id,
  }
  const fundsDisbursed = cleanNumber(entry.funds_disbursed)
  const plannedDateOfCompletion = cleanDate(entry.planned_date_of_completion)
  const alternativeTechnologies = cleanAlternativeTechnologies(
    entry.alternative_technologies,
  )
  const enterprises = cleanEnterprises(entry.enterprises)
  const equipments = cleanEquipments(entry.equipments)

  if (fundsDisbursed) {
    payload.funds_disbursed = fundsDisbursed
  }
  if (plannedDateOfCompletion) {
    payload.planned_date_of_completion = plannedDateOfCompletion
  }
  if (alternativeTechnologies.length > 0) {
    payload.alternative_technologies = alternativeTechnologies
  }
  if (enterprises.length > 0) {
    payload.enterprises = enterprises
  }
  if (equipments.length > 0) {
    payload.equipments = equipments
  }

  return payload
}

export const getOtherOptionId = (options: OptionsType[]) =>
  find(options, (option) => lowerCase(option.name).includes('other'))?.id

export const formatOptions = (options: [string, string][]) =>
  map(options, (option) => ({
    id: option[0],
    name: option[1],
  }))

export const formatAgencyData = <T extends { agency_id: number }>(
  data: T[],
  subField: keyof T,
) =>
  reduce(
    data,
    (acc: Record<string, any>[], entry) => {
      forEach(entry[subField] as object[], (subEntry) => {
        acc.push({ agency_id: entry.agency_id, ...subEntry })
      })

      return acc
    },
    [],
  )

export const checkHasErrors = (entry: Record<string, any>) =>
  entry && Object.keys(entry).length > 0

export const hasSectionErrors = (errors: Record<string, any>) =>
  Object.values(errors).some((error) => {
    if (!Array.isArray(error)) {
      return Object.values(error as Record<string, any>).some((nestedError) =>
        nestedError.some((item: Record<string, any>) =>
          Array.isArray(item.errors)
            ? item.errors.some(checkHasErrors)
            : checkHasErrors(item.errors),
        ),
      )
    }

    return error.some((item) => {
      if (Array.isArray(item)) {
        return item.some(checkHasErrors)
      }

      return typeof item === 'string' || checkHasErrors(item)
    })
  })

const formatNestedErrors = (
  errors: Record<string, any>,
  crtFieldNames: Record<string, string>,
  field: string,
  index: number,
) => {
  const errorFields = Object.keys(errors)

  if (errorFields.length !== 0) {
    const fieldNames = map(errorFields, (field) => crtFieldNames[field]).join(
      ', ',
    )
    const errorMessage =
      errorFields.length > 1 ? 'These fields are' : 'This field is'

    return {
      id: `${field}-${index}`,
      message: `${crtFieldNames[field]} ${index + 1} : ${fieldNames} - ${errorMessage} not valid.`,
    }
  }

  return null
}

export const formatErrors = (
  errors: { [key: string]: string[] },
  nestedField?: string,
  tabKey?: string,
) => {
  const extraFieldNames: Record<string, string> = !!tabKey
    ? {
        name:
          {
            enterprises: 'Name of enterprise',
            equipments: 'Name of equipment',
          }[tabKey] ?? '',
      }
    : {}

  const initialFieldNames = { ...pcrFieldsMapping, ...pcrFieldsErrorsMapping }
  const fieldNames = !!tabKey
    ? { ...initialFieldNames, ...extraFieldNames }
    : initialFieldNames

  return Object.entries(errors)
    .filter(([, error]) => error.length > 0)
    .flatMap(([field, error]) =>
      error
        .flatMap((nestedError, index) => {
          if (typeof nestedError === 'string') {
            return {
              id: `${field}-${index}`,
              message: `${fieldNames[field]}: ${nestedError}`,
            }
          } else {
            if (Array.isArray(nestedError)) {
              return reduce(
                nestedError,
                (acc: any[], entry: Record<string, any>, nestedIndex) => [
                  ...acc,
                  formatNestedErrors(entry, fieldNames, field, nestedIndex),
                  ...map(entry[nestedField!], (nestedEntry, deepNestedIndex) =>
                    formatNestedErrors(
                      nestedEntry,
                      fieldNames,
                      nestedField!,
                      deepNestedIndex,
                    ),
                  ),
                ],
                [],
              )
            }

            if (Object.keys(nestedError).length !== 0) {
              return formatNestedErrors(nestedError, fieldNames, field, index)
            }

            return null
          }
        })
        .filter(Boolean),
    )
}

export const getErrorIndex = (
  sectionData: any,
  field: string,
  crtAgencyId: number,
  index: number,
) => {
  const countByAgency = map(sectionData, (data) => ({
    [data.agency_id]: data[field].length,
  }))

  const crtAgencyIndex = findIndex(
    countByAgency,
    (entry) => Object.keys(entry)[0] === String(crtAgencyId),
  )

  return (
    sumBy(
      countByAgency.slice(0, crtAgencyIndex),
      (entry) => Object.values(entry)[0],
    ) + index
  )
}

export const hasValidWordCount = (text: string) => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return wordCount >= 150 && wordCount <= 250
}

export const validateWordCount = (
  errors: Record<string, any>,
  field: string,
  value: string,
) => {
  if (!hasValidWordCount(value)) {
    return { ...errors, [field]: [validWordCountMessage] }
  }

  return errors[field]?.includes(validWordCountMessage)
    ? omit(errors, [field])
    : errors
}

export const formatNestedPcErrors = (
  pc: CauseOfDelayProjectComponent | LessonLearnedProjectComponent,
  updatedErrors: Record<string, any>,
  existingErrors: Record<string, any>,
  field: string,
  idField: string,
) => {
  const entries = (pc as Record<string, any>)[field]

  if (field in pc) {
    updatedErrors[field] = map(entries, (entry, index) => {
      const existingEntryErrors = existingErrors[field]?.[index] ?? {}

      let entryErrors = { ...existingEntryErrors }

      if (!entry[idField]) {
        entryErrors[idField] = [requiredMessage]
      } else if (entryErrors[idField]?.includes(requiredMessage)) {
        entryErrors = omit(entryErrors, [idField])
      }

      entryErrors = validateWordCount(
        entryErrors,
        'description',
        entry.description,
      )

      return entryErrors
    })
  }
}

const hasErrorMessage = (errors: Record<string, any>): boolean => {
  if (typeof errors === 'string') {
    return errors === requiredMessage || errors === validWordCountMessage
  }

  if (Array.isArray(errors)) {
    return errors.some((error) => hasErrorMessage(error))
  }

  if (errors && typeof errors === 'object') {
    return Object.values(errors).some((error) => hasErrorMessage(error))
  }

  return false
}

export const getSectionAgencies = (agencies: ApiAgency[], sectionData: any) =>
  agencies && agencies.length > 0
    ? map(
        sectionData,
        (entry) => find(agencies, (agency) => agency.id === entry.agency_id)!,
      )
    : []

export const normalizeErrors = (errors: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(errors).filter(([, value]) => {
      if (!Array.isArray(value)) {
        return true
      }

      return some(value, checkHasErrors)
    }),
  )

export const groupSummaryOfKeyDataErrors = (
  errors: Record<string, any>,
  projectId: number,
) => {
  const crtProjectErrors = errors[projectId]

  if (!crtProjectErrors) {
    return errors
  }

  const projectErrors = crtProjectErrors[0].errors
  const groupedErrors = {
    general: pick(projectErrors, [
      'funds_disbursed',
      'planned_date_of_completion',
    ]),
    alternative_technologies: pick(projectErrors, 'alternative_technologies'),
    enterprises: pick(projectErrors, 'enterprises'),
    equipments: pick(projectErrors, 'equipments'),
  }

  return groupedErrors
}

export const formatPayload = (
  pcrDefaultData: ReturnType<typeof useGetPCRDefaults>,
  PCRData: PCRData,
  ratingOptions: OptionsType[],
) => {
  const {
    overview,
    results_assessment,
    causes_of_delay,
    lessons_learned,
    gender_mainstreaming,
    sdgs_contribution,
  } = PCRData

  const overviewPrefilledData = {
    ...pick(pcrDefaultData.data, [
      'project_date_approved',
      'project_date_completion',
      'phase_out_ods_actual',
      'phase_out_ods_approved',
      'phase_out_co2_eq_t_actual',
      'phase_out_co2_eq_t_approved',
    ]),
    decision_ids: pcrDefaultData.data?.decisions,
  }

  const overviewData = {
    ...overview,
    rating_explanation_other:
      overview.rating === getOtherOptionId(ratingOptions)
        ? overview.rating_explanation_other
        : null,
  }

  const resultsAssessmentData = formatAgencyData<PCRResultsAssessmentData>(
    results_assessment,
    'activities',
  )

  const causesOfDelayProjectComponents = flatMap(
    causes_of_delay,
    ({ agency_id, project_components }) =>
      map(
        project_components,
        ({ project_component_option_id, delay_causes }) => ({
          agency_id,
          project_component_option_id,
          delay_causes,
          learned_lessons: [],
        }),
      ),
  )

  const lessonsLearnedProjectComponents = flatMap(
    lessons_learned,
    ({ agency_id, project_components }) =>
      map(
        project_components,
        ({ project_component_option_id, learned_lessons }) => ({
          agency_id,
          project_component_option_id,
          delay_causes: [],
          learned_lessons,
        }),
      ),
  )

  const projectComponentsData = [
    ...causesOfDelayProjectComponents,
    ...lessonsLearnedProjectComponents,
  ]

  const genderMainstreamingsData = formatAgencyData<PCRGenderMainstreamingData>(
    gender_mainstreaming,
    'gender_mainstreamings',
  )

  const sdgsContributionData = filter(
    sdgs_contribution,
    (sdg) => sdg.goals.length > 0,
  )

  return {
    ...overviewPrefilledData,
    ...overviewData,
    pcr_projects: PCRData.summary_of_key_data.map(buildPCRProjectPayload),
    activities: resultsAssessmentData,
    project_components: projectComponentsData,
    gender_mainstreamings: genderMainstreamingsData,
    sustainable_development_goals: sdgsContributionData,
  }
}

export const isSubmitDisabled = (errors: Record<string, any>) => {
  const hasOverviewDefaultErrors = hasErrorMessage(errors.overview)
  const hasResultsAssessmentDefaultErrors = hasErrorMessage(
    errors.results_assessment,
  )
  const hasCausesOfDelayDefaultErrors = hasErrorMessage(errors.causes_of_delay)
  const hasLessonsLearnedDefaultErrors = hasErrorMessage(errors.lessons_learned)
  const hasGenderMainstreamingDefaultErrors = hasErrorMessage(
    errors.gender_mainstreaming,
  )
  const hasSDGsDefaultErrors = hasErrorMessage(errors.sdgs_contribution)
  const hasEvidencesDefaultErrors = hasErrorMessage(errors.supporting_evidences)

  return (
    hasOverviewDefaultErrors ||
    hasResultsAssessmentDefaultErrors ||
    hasCausesOfDelayDefaultErrors ||
    hasLessonsLearnedDefaultErrors ||
    hasGenderMainstreamingDefaultErrors ||
    hasSDGsDefaultErrors ||
    hasEvidencesDefaultErrors
  )
}
