import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { getMeetingNr } from '../../Utils/utilFunctions'
import { MetaProjectDetailType } from './UpdateMyaData/types'
import {
  approvalOdsFields,
  approvalToOdsMap,
  initialTranferedProjectData,
  PROJECTS_PER_PAGE,
  tableColumns,
} from './constants'
import {
  ProjIdentifiers,
  ProjectSpecificFields,
  ProjectData,
  CrossCuttingFields,
  SpecificFields,
  ProjectFilesObject,
  ProjectFile,
  OptionsType,
  ProjectTypeApi,
  ProjectAllVersionsFiles,
  OdsOdpFields,
  ListingProjectData,
  ProjectTransferData,
  SetProjectData,
} from './interfaces'
import { formatApiUrl, formatDecimalValue } from '@ors/helpers'
import { Cluster, Country, ProjectFieldHistoryValue } from '@ors/types/store'

import dayjs from 'dayjs'
import {
  ITooltipParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community'
import {
  concat,
  difference,
  filter,
  find,
  flatMap,
  fromPairs,
  get,
  groupBy,
  isArray,
  isNaN,
  isNil,
  isNull,
  keys,
  lowerCase,
  map,
  min,
  omit,
  pick,
  reduce,
} from 'lodash'

const getFieldId = <T>(
  field: ProjectSpecificFields,
  data: T,
  projectData?: ProjectTypeApi,
) => {
  const fieldName = field.read_field_name === 'group' ? 'name_alt' : 'name'
  return find(formatOptions(field, projectData), {
    [fieldName]: data[field.read_field_name as keyof T]?.toString(),
  })?.id
}

export const getFormattedDecimalValue = (value: string | null) =>
  !isNil(value) ? Number(value).toString() : value

export const getDefaultValues = <T>(
  fields: ProjectSpecificFields[],
  data?: T,
  projectData?: ProjectTypeApi,
) =>
  reduce(
    fields,
    (acc: any, field) => {
      const { data_type, write_field_name } = field
      const odsReplacementFieldName = 'ods_replacement_text' as keyof T
      const hasData = !!data

      if (write_field_name === odsReplacementFieldName) {
        const dropdownField = 'ods_replacement' as keyof T

        acc[dropdownField] = hasData ? data[dropdownField] : null
        acc[odsReplacementFieldName] = hasData
          ? data[odsReplacementFieldName]
          : ''

        return acc
      }

      if (hasData) {
        acc[write_field_name] =
          data_type === 'drop_down'
            ? getFieldId<T>(field, data, projectData)
            : data_type === 'decimal'
              ? getFormattedDecimalValue(data[write_field_name])
              : data_type === 'boolean'
                ? (data[write_field_name] ?? false)
                : data[write_field_name]
      } else {
        acc[write_field_name] =
          data_type === 'text' ? '' : data_type === 'boolean' ? false : null
      }

      return acc
    },
    {},
  )

export const canGoToSecondStep = (
  projIdentifiers: ProjIdentifiers,
  agency_id: number | undefined,
) =>
  !!(
    projIdentifiers.country &&
    projIdentifiers.meeting &&
    projIdentifiers.cluster &&
    projIdentifiers.agency &&
    projIdentifiers.lead_agency
  ) && !getAgencyErrorType(projIdentifiers, agency_id)

export const getIsSaveDisabled = (
  projIdentifiers: ProjIdentifiers,
  crossCuttingFields: CrossCuttingFields,
  agency_id: number | undefined,
  shouldValidateTotalFund: boolean,
) => {
  const canLinkToBp = canGoToSecondStep(projIdentifiers, agency_id)
  const {
    project_type,
    sector,
    title,
    total_fund,
    support_cost_psc,
    project_start_date,
    project_end_date,
  } = crossCuttingFields

  return (
    !canLinkToBp ||
    !(project_type && sector && title) ||
    (shouldValidateTotalFund &&
      Number(total_fund) < Number(support_cost_psc)) ||
    dayjs(project_start_date).isAfter(dayjs(project_end_date))
  )
}

const filterSubstancesOptions = (options: any, group_id: number | null) =>
  filter(options, (option) => option.group_id === group_id)
const filterBlendsOptions = (options: any, group_id: number | null) =>
  filter(options, (option) => option.substance_groups.includes(group_id))

export const formatOptions = (
  field: ProjectSpecificFields,
  data?: any,
): OptionsType[] => {
  const options = field.options as
    | OptionsType[]
    | Record<'substances' | 'blends', (OptionsType & { composition: string })[]>

  const groupValue = data ? data.group_id || data.group : null

  if (field.write_field_name === 'ods_display_name' && !isArray(options)) {
    return concat(
      data
        ? filterSubstancesOptions(options.substances, groupValue)
        : options.substances,
      data ? filterBlendsOptions(options.blends, groupValue) : options.blends,
    ).map((option) => {
      return {
        ...option,
        id: `${option.baseline_type}-${option.id}`,
        label:
          option.baseline_type === 'blend'
            ? option.name + ' (' + option.composition + ')'
            : option.name,
      }
    })
  }

  return map(options, (option: OptionsType | [string, string]) => {
    if (isArray(option)) {
      return { id: option[0], name: option[1] }
    }

    if (field.write_field_name === 'ods_replacement') {
      return { ...option, name: formatFieldLabel(option.name) }
    }

    return option
  })
}

export const getSectionFields = (
  fields: ProjectSpecificFields[],
  section: string,
) => filter(fields, (field) => field.section === section)

export const formatNumberColumns = (
  params: ValueGetterParams | ITooltipParams | ValueFormatterParams,
  field: string,
  valueFormatter?: {
    maximumFractionDigits: number
    minimumFractionDigits: number
  },
) => {
  const value = params.data[field]

  return !isNil(value) && !isNaN(parseFloat(value))
    ? valueFormatter
      ? formatDecimalValue(parseFloat(value), valueFormatter)
      : formatDecimalValue(parseFloat(value))
    : ''
}

const normalizeValues = (data: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )

const normalizeOdsOdp = (
  projectSpecificFields: SpecificFields,
  specificFieldsAvailable: string[],
  projectFields: ProjectSpecificFields[],
  altTechs: OptionsType[],
) =>
  map(projectSpecificFields.ods_odp, (field, index) => {
    const odsDisplayName = get(field, 'ods_display_name') ?? ''
    const baselineTechValue = odsDisplayName.split('-')?.[1]
    const baselineTechObj = odsDisplayName.includes('substance')
      ? { ods_substance_id: baselineTechValue, ods_blend_id: undefined }
      : { ods_substance_id: undefined, ods_blend_id: baselineTechValue }

    const oldData = defaultOldFields(
      field,
      specificFieldsAvailable,
      projectFields,
    )

    const crtOdsOdpData = projectSpecificFields?.ods_odp?.[index]
    const hasOtherReplacement = isOtherOdsReplacement(
      altTechs,
      crtOdsOdpData?.ods_replacement,
    )

    return {
      ...pick(field, specificFieldsAvailable),
      ...(specificFieldsAvailable.includes('ods_display_name')
        ? baselineTechObj
        : {}),
      ...oldData,
      ...(specificFieldsAvailable.includes('ods_replacement_text')
        ? {
            ods_replacement: crtOdsOdpData?.ods_replacement,
            ods_replacement_text: hasOtherReplacement
              ? crtOdsOdpData?.ods_replacement_text
              : null,
          }
        : {}),
      sort_order: index + 1,
    }
  })

const formatActualData = (data: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, !value ? null : value]),
  )

export const formatSubmitData = (
  projectData: ProjectData,
  setProjectData: Dispatch<SetStateAction<ProjectData>>,
  specificFields: ProjectSpecificFields[],
  projectFields: ProjectSpecificFields[],
  altTechs: OptionsType[],
) => {
  const {
    projIdentifiers,
    bpLinking,
    crossCuttingFields,
    projectSpecificFields,
  } = projectData
  const crossCuttingFieldsForEdit = omit(crossCuttingFields, [
    'adjustment',
    'interest',
  ])

  const filteredFields = filter(specificFields, (field) => !field.is_actual)
  const specificFieldsAvailable = map(filteredFields, 'write_field_name')

  const filteredActualFields = filter(
    specificFields,
    (field) => field.is_actual,
  )
  const specificActualFieldsAvailable = map(
    filteredActualFields,
    'write_field_name',
  )

  const crtProjectSpecificFields = getCrtProjectSpecificFields(
    filteredFields,
    projectData,
    specificFieldsAvailable,
  )
  const updatedOldSpecificFieldsValues = defaultOldFields(
    projectData.projectSpecificFields,
    [...specificFieldsAvailable, ...specificActualFieldsAvailable],
    projectFields,
  )

  const hasOdsOdpFields = filteredFields.find(
    (field) => field.table === 'ods_odp',
  )
  const updatedOdsOdpValues = hasOdsOdpFields
    ? normalizeOdsOdp(
        projectSpecificFields,
        specificFieldsAvailable,
        projectFields,
        altTechs,
      )
    : []

  setProjectData((prevData) => ({
    ...prevData,
    projectSpecificFields: {
      ...prevData.projectSpecificFields,
      ...updatedOldSpecificFieldsValues,
      ods_odp: map(updatedOdsOdpValues, (ods_odp) =>
        omit(normalizeValues(ods_odp), ['ods_blend_id', 'ods_substance_id']),
      ),
    },
  }))

  return {
    ...projIdentifiers,
    bp_activity: bpLinking.bpId,
    ...normalizeValues(crossCuttingFieldsForEdit),
    ...normalizeValues(crtProjectSpecificFields),
    ...updatedOldSpecificFieldsValues,
    ods_odp: map(updatedOdsOdpValues, (ods_odp) =>
      omit(normalizeValues(ods_odp), ['id', 'ods_display_name']),
    ),
  }
}

export const formatApprovalData = (
  projectData: ProjectData,
  setProjectData: Dispatch<SetStateAction<ProjectData>>,
  specificFields: ProjectSpecificFields[],
  projectFields: ProjectSpecificFields[],
  altTechs: OptionsType[],
) => {
  const { crossCuttingFields, projectSpecificFields, approvalFields } =
    projectData

  const fields = filter(
    specificFields,
    (field) => field.table === 'ods_odp' || field.section === 'Approval',
  )
  const specificFieldsAvailable = [
    ...map(fields, 'write_field_name'),
    'total_fund',
    'support_cost_psc',
  ]

  const crtProjectSpecificFields = pick(
    {
      ...crossCuttingFields,
      ...approvalFields,
    },
    specificFieldsAvailable,
  )

  const hasOdsOdpFields = fields.find((field) => field.table === 'ods_odp')
  const updatedOdsOdpValues = hasOdsOdpFields
    ? normalizeOdsOdp(
        projectSpecificFields,
        specificFieldsAvailable,
        projectFields,
        altTechs,
      )
    : []

  setProjectData((prevData) => ({
    ...prevData,
    projectSpecificFields: {
      ...prevData.projectSpecificFields,
      ods_odp: map(
        updatedOdsOdpValues,
        (ods_odp) =>
          omit(normalizeValues(ods_odp), [
            'ods_blend_id',
            'ods_substance_id',
          ]) as OdsOdpFields,
      ),
    },
  }))

  return {
    ...normalizeValues(crtProjectSpecificFields),
    ods_odp: map(updatedOdsOdpValues, (ods_odp) =>
      omit(normalizeValues(ods_odp), ['id', 'ods_display_name']),
    ),
  }
}

export const getActualData = (
  projectData: ProjectData,
  setProjectData: Dispatch<SetStateAction<ProjectData>>,
  specificFields: ProjectSpecificFields[],
  projectFields: ProjectSpecificFields[],
) => {
  const filteredFields = filter(specificFields, (field) => field.is_actual)
  const specificFieldsAvailable = map(filteredFields, 'write_field_name')
  const nonActualFields = filter(specificFields, (field) => !field.is_actual)
  const nonActualFieldsAvailable = map(nonActualFields, 'write_field_name')

  const crtProjectSpecificFields = getCrtProjectSpecificFields(
    filteredFields,
    projectData,
    specificFieldsAvailable,
  )
  const updatedOldSpecificFieldsValues = defaultOldFields(
    projectData.projectSpecificFields,
    [...specificFieldsAvailable, ...nonActualFieldsAvailable],
    projectFields,
  )

  setProjectData((prevData) => ({
    ...prevData,
    projectSpecificFields: {
      ...prevData.projectSpecificFields,
      ...updatedOldSpecificFieldsValues,
    },
  }))

  return {
    ...formatActualData({
      ...crtProjectSpecificFields,
      ...updatedOldSpecificFieldsValues,
    }),
  }
}

export const getProjIdentifiersErrors = (
  projIdentifiers: ProjIdentifiers,
  errors: { [key: string]: [] },
) => {
  const requiredFields = [
    'country',
    'meeting',
    'agency',
    'cluster',
    'lead_agency',
  ]
  const allFields = [
    ...requiredFields,
    'lead_agency_submitting_on_behalf',
    'production',
  ]

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => allFields.includes(key)),
  )

  return {
    ...requiredFields.reduce((acc: any, field) => {
      acc[field] = !projIdentifiers[field as keyof ProjIdentifiers]
        ? ['This field is required.']
        : []

      return acc
    }, {}),
    ...filteredErrors,
  }
}

export const getAgencyErrorType = (
  projIdentifiers: ProjIdentifiers | ProjectTypeApi,
  agencyId: number | undefined,
) => {
  const { lead_agency, lead_agency_submitting_on_behalf } = projIdentifiers

  const agency =
    'agency_id' in projIdentifiers
      ? projIdentifiers.agency_id
      : projIdentifiers.agency

  if (!(agency && lead_agency) && !agencyId) return null

  return agencyId && agencyId !== agency && agencyId !== lead_agency
    ? 'no_valid_agency'
    : lead_agency_submitting_on_behalf
      ? agency === lead_agency
        ? 'similar_agencies'
        : null
      : agency !== lead_agency
        ? 'different_agencies'
        : null
}

export const checkInvalidValue = (value: any) =>
  isNil(value) || value === '' || value.length === 0

const getFieldErrors = (
  fields: string[],
  data: any,
  project: ProjectTypeApi | undefined,
) =>
  fields.reduce((acc: any, field) => {
    acc[field] = checkInvalidValue(data[field as keyof typeof fields])
      ? ['title', 'project_type', 'sector'].includes(field) ||
        project?.submission_status !== 'Draft'
        ? field.includes('_actual')
          ? ['This field is not completed.']
          : ['This field is required.']
        : ['This field is required for submission.']
      : []

    return acc
  }, {})

export const getCrossCuttingErrors = (
  crossCuttingFields: CrossCuttingFields,
  errors: { [key: string]: [] },
  mode: string,
  project: ProjectTypeApi | undefined,
  validateApproval: boolean,
  shouldValidateTotalFund: boolean,
) => {
  const allRequiredFields = [
    'title',
    'project_type',
    'sector',
    'description',
    'consumption_level_status',
    'total_fund',
    'support_cost_psc',
    'project_start_date',
    'project_end_date',
    'project_duration',
  ]
  const nonRequiredFields = [
    'subsector_ids',
    'blanket_or_individual_consideration',
    'interest',
    'adjustment',
  ]

  const requiredFields = shouldValidateTotalFund
    ? allRequiredFields
    : difference(allRequiredFields, ['total_fund'])

  const requiredFieldsAfterSubmission =
    project?.submission_status !== 'Draft'
      ? [...requiredFields, 'blanket_or_individual_consideration']
      : requiredFields

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) =>
      [...allRequiredFields, ...nonRequiredFields].includes(key),
    ),
  )

  const { total_fund, support_cost_psc, project_start_date, project_end_date } =
    crossCuttingFields

  const fieldsToCheck =
    mode === 'edit' ? requiredFieldsAfterSubmission : requiredFields.slice(0, 3)

  return {
    ...getFieldErrors(fieldsToCheck, crossCuttingFields, project),
    ...(shouldValidateTotalFund &&
      Number(total_fund) < Number(support_cost_psc) && {
        support_cost_psc: ['Value cannot be greater than project funding.'],
      }),
    ...(validateApproval &&
      mode === 'edit' &&
      project?.submission_status === 'Recommended' &&
      dayjs(project_end_date).isBefore(dayjs(), 'day') && {
        project_end_date: ['Cannot be a past date.'],
      }),
    ...(dayjs(project_end_date).isBefore(dayjs(project_start_date)) && {
      project_end_date: ['Start date cannot be later than end date.'],
    }),
    ...filteredErrors,
  }
}

const getFormattedErrors = (
  errors: { [key: string]: [] },
  specificFields: ProjectSpecificFields[] | undefined = [],
) =>
  Object.entries(errors).reduce(
    (acc, [key, errMsg]) => {
      const field = specificFields.find(
        ({ write_field_name }) => write_field_name === key,
      )

      if (field) {
        acc[field.label || key] = errMsg as string[]
      }

      return acc
    },
    {} as Record<string, string[]>,
  )

export const getApprovalErrors = (
  approvalData: SpecificFields,
  crossCuttingFields: CrossCuttingFields,
  specificFields: ProjectSpecificFields[] | undefined = [],
  errors: { [key: string]: [] },
  project: ProjectTypeApi | undefined,
) => {
  const requiredFields = ['decision', 'date_completion', 'programme_officer']

  const fieldsForValidation = [
    ...requiredFields,
    ...approvalOdsFields,
    'funding_window',
    'excom_provision',
  ]

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => fieldsForValidation.includes(key)),
  )

  const allErrors = {
    ...getFieldErrors(requiredFields, approvalData, project),
    ...(dayjs(approvalData.date_completion).isBefore(dayjs(), 'day') && {
      date_completion: ['Cannot be a past date.'],
    }),
    ...(dayjs(approvalData.date_completion).isBefore(
      dayjs(crossCuttingFields.project_start_date),
    ) && {
      date_completion: ['Start date cannot be later than date of completion.'],
    }),
    ...filteredErrors,
  }

  return getFormattedErrors(allErrors, specificFields)
}

export const getPostExcomApprovalErrors = (
  approvalData: SpecificFields,
  specificFields: ProjectSpecificFields[] | undefined = [],
  errors: { [key: string]: [] },
  project: ProjectTypeApi | undefined,
) => {
  const requiredFields = ['programme_officer']
  const allFields = [...requiredFields, 'excom_provision']

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => allFields.includes(key)),
  )

  const allErrors = {
    ...getFieldErrors(requiredFields, approvalData, project),
    ...filteredErrors,
  }

  return getFormattedErrors(allErrors, specificFields)
}

export const getMpErrors = (
  mpData: Record<string, any>,
  metaprojectData: MetaProjectDetailType | null,
  errors: { [key: string]: [] },
  project: ProjectTypeApi | undefined,
  mode: string,
) => {
  const allKeys = keys(mpData)

  if (!metaprojectData || allKeys.length === 0) {
    return {}
  }

  const hasDefaultErrors =
    mode === 'edit' &&
    project?.submission_status === 'Recommended' &&
    metaprojectData.is_draft

  const requiredFields = [
    'project_funding',
    'support_cost',
    'start_date',
    'end_date',
  ]

  const { start_date, end_date } = mpData

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => allKeys.includes(key)),
  )

  const allErrors = {
    ...(hasDefaultErrors && {
      ...getFieldErrors(requiredFields, mpData, project),
    }),
    ...(dayjs(end_date).isBefore(dayjs(start_date)) && {
      end_date: ['Start date cannot be later than end date.'],
    }),
    ...filteredErrors,
  }

  return Object.entries(allErrors).reduce(
    (acc, [key, errMsg]) => {
      const field = metaprojectData.field_data[key].label

      if (field) {
        acc[field] = errMsg as string[]
      }

      return acc
    },
    {} as Record<string, string[]>,
  )
}

export const hasSpecificField = (
  specificFields: ProjectSpecificFields[],
  field: string,
) => find(specificFields, (crtField) => crtField.write_field_name === field)

export const getDefaultImpactErrors = (
  projectSpecificFields: SpecificFields,
  specificFields: ProjectSpecificFields[],
) => {
  const errorMsg = 'Number cannot be greater than the total one.'

  const validationFieldsPairs: [keyof SpecificFields, keyof SpecificFields][] =
    reduce(
      specificFields,
      (acc: any, field) => {
        const fieldName = field.write_field_name as string

        if (fieldName.includes('_female_')) {
          const totalFieldName = `total_${fieldName.replace(/_female_/, '_')}`

          if (hasSpecificField(specificFields, totalFieldName)) {
            acc = [...acc, [fieldName, totalFieldName]]
          }
        }
        return acc
      },
      [],
    )

  return Object.fromEntries(
    validationFieldsPairs
      .filter(
        ([key, totalKey]) =>
          (projectSpecificFields[key] ?? 0) >
          (projectSpecificFields[totalKey] ?? 0),
      )
      .map(([key]) => [key, [errorMsg]]),
  )
}

export const hasSectionErrors = (errors: { [key: string]: string[] }) =>
  Object.values(errors).some((errors) => errors.length > 0)

export const getTransferErrors = (
  projectData: ProjectTransferData,
  project: ProjectTypeApi,
  shouldValidateTotalFund: boolean,
) => {
  const { fund_transferred, psc_transferred, psc_received } = projectData
  const initialFieldsToValidate = keys(initialTranferedProjectData).filter(
    (field) => field !== 'transfer_excom_provision',
  )
  const fieldsToValidate = shouldValidateTotalFund
    ? initialFieldsToValidate
    : difference(initialFieldsToValidate, ['fund_transferred'])

  return {
    ...getFieldErrors(fieldsToValidate, projectData, project),
    ...(shouldValidateTotalFund &&
      Number(fund_transferred) > Number(project.total_fund) && {
        fund_transferred: ['Value cannot be greater than project funding.'],
      }),
    ...(Number(psc_transferred) > Number(project.support_cost_psc) && {
      psc_transferred: ['Value cannot be greater than project support costs.'],
    }),
    ...(Number(psc_received) > Number(project.support_cost_psc) && {
      psc_received: ['Value cannot be greater than project support costs.'],
    }),
    ...(shouldValidateTotalFund &&
      Number(psc_transferred) > Number(fund_transferred) && {
        psc_transferred: [
          'Value cannot be greater than transferred project funding.',
        ],
      }),
    ...(shouldValidateTotalFund &&
      Number(psc_received) > Number(fund_transferred) && {
        psc_received: [
          'Value cannot be greater than transferred project funding.',
        ],
      }),
  }
}

export const getFieldLabel = (
  specificFields: ProjectSpecificFields[],
  field: string,
) => {
  const specificField = specificFields.find(
    ({ write_field_name }) => write_field_name === field,
  )
  return specificField?.label ?? field
}

export const getSpecificFieldsErrors = (
  projectSpecificFields: SpecificFields,
  specificFields: ProjectSpecificFields[],
  errors: { [key: string]: [] },
  mode: string,
  canEditApprovedProjects: boolean,
  project?: ProjectTypeApi,
) => {
  const isEditMode = project && mode === 'edit'
  const version = isEditMode ? project.version : 1

  const fieldsNotValidated = [
    'destruction_technology',
    'end_users',
    'energy_savings',
  ]

  const fieldNames = map(
    filter(
      specificFields,
      ({ table, section, editable_in_versions, data_type, write_field_name }) =>
        table === 'project' &&
        section !== 'MYA' &&
        data_type !== 'boolean' &&
        !fieldsNotValidated.includes(write_field_name) &&
        (canEditApprovedProjects ||
          (isEditMode && project.version > 3) ||
          editable_in_versions.includes(version)),
    ),
    'write_field_name',
  ) as string[]
  const allFieldNames = [...fieldNames, ...fieldsNotValidated]

  const defaultImpactErrors =
    getDefaultImpactErrors(projectSpecificFields, specificFields) ?? {}

  const sectionErrors =
    mode === 'edit' && project
      ? (getFieldErrors(fieldNames, projectSpecificFields, project) ?? {})
      : {}
  const updatedErrors = { ...sectionErrors, ...defaultImpactErrors, ...errors }

  const filteredErrors = Object.entries(updatedErrors)
    .filter(([key]) => allFieldNames.includes(key))
    .reduce(
      (acc, [key, errMsg]) => {
        const field = specificFields.find(
          ({ write_field_name }) => write_field_name === key,
        )

        if (field) {
          const { section, label } = field

          if (!acc[section]) {
            acc[section] = {}
          }
          acc[section][label || key] = errMsg
        }

        return acc
      },
      {} as Record<string, Record<string, any>>,
    )

  return filteredErrors
}

export const getNonFieldErrors = (errors: { [key: string]: [] }) => {
  const nonFieldsOdsOdpErrors = errors?.['ods_odp']?.find(
    (err) => Object.keys(err)[0] === 'non_field_errors',
  )
  return [
    ...(errors?.['non_field_errors'] || []),
    ...(nonFieldsOdsOdpErrors?.['non_field_errors'] || []),
  ]
}

export const getFileFromMetadata = async (fileMeta: {
  download_url: string
  filename: string
}): Promise<File> => {
  const res = await fetch(formatApiUrl(fileMeta.download_url), {
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.statusText}`)
  }

  const blob = await res.blob()

  const contentType =
    res.headers.get('Content-Type') || 'application/octet-stream'

  return new File([blob], fileMeta.filename, { type: contentType })
}

export const formatErrors = (
  errors: { [key: string]: string[] },
  fieldNames?: Record<string, string>,
) => {
  const crtFieldNames = fieldNames ?? tableColumns

  return Object.entries(errors)
    .filter(([, errorMsgs]) => errorMsgs.length > 0)
    .flatMap(([field, errorMsgs]) =>
      errorMsgs.map((errMsg, idx) => ({
        id: `${field}-${idx}`,
        message: `${crtFieldNames[field] ?? field}: ${errMsg}`,
      })),
    )
}

export const getHasNoFiles = (
  id: number,
  files?: ProjectFilesObject,
  projectFiles?: ProjectFile[],
) => {
  const crtVersionFiles = filter(
    projectFiles,
    (file) =>
      file.project_id === id && !files?.deletedFilesIds?.includes(file.id),
  )

  return files?.newFiles?.length === 0 && crtVersionFiles.length === 0
}

export const getIsUpdatablePostExcom = (
  submission_status: string | undefined,
  status: string | undefined,
) =>
  submission_status === 'Approved' &&
  status !== 'Closed' &&
  status !== 'Transferred'

export const getMenus = (
  permissions: Record<string, boolean>,
  projectData?: ListingProjectData,
  onTransferProject?: () => void,
) => {
  const {
    canViewBp,
    canUpdateBp,
    canViewEnterprises,
    canEditProjectEnterprise,
    canUpdatePostExcom,
    canTransferProjects,
    canViewMetaProjects,
  } = permissions
  const {
    projectId,
    projectSubmissionStatus,
    projectStatus,
    projectMetaprojectId,
    projectEditable,
  } = projectData ?? {}

  return [
    {
      title: 'Planning',
      menuItems: [
        {
          title: 'View business plans',
          url: '/business-plans',
          disabled: !canViewBp,
        },
        {
          title: 'New business plan',
          url: '/business-plans/upload',
          disabled: !canUpdateBp,
        },
      ],
    },
    {
      title: 'Approved Projects',
      menuItems: [
        {
          title: 'Update MYA data',
          url: `/projects-listing/update-mya-data${projectId ? `/${projectMetaprojectId}` : ''}`,
          disabled:
            !canViewMetaProjects ||
            (!!projectId &&
              !(
                projectSubmissionStatus === 'Approved' && !!projectMetaprojectId
              )),
        },
        {
          title: 'Update post ExCom fields',
          url: `/projects-listing/${projectId}/post-excom-update`,
          disabled:
            !canUpdatePostExcom ||
            !projectId ||
            !getIsUpdatablePostExcom(projectSubmissionStatus, projectStatus),
        },
        {
          title: 'Update project enterprises',
          url: `/projects-listing/projects-enterprises/${projectId}`,
          disabled:
            !canEditProjectEnterprise ||
            !projectId ||
            projectSubmissionStatus !== 'Approved',
        },
        {
          title: 'Manage enterprises',
          url: `/projects-listing/enterprises`,
          disabled: !canViewEnterprises,
        },
        {
          title: 'Transfer a project',
          url: null,
          onClick: onTransferProject,
          disabled:
            !canTransferProjects ||
            !projectId ||
            !projectEditable ||
            projectSubmissionStatus !== 'Approved',
        },
        {
          title: 'Funding window',
          url: '/projects-listing/funding-window',
          disabled: !canViewMetaProjects,
        },
      ],
    },
    {
      title: 'Reporting',
      menuItems: [
        { title: 'Annual Progress Reports', url: '/apr' },
        { title: 'Raise a PCR', url: null, disabled: true },
      ],
    },
  ]
}

export const getClusterDetails = (
  clusters: Cluster[],
  clusterId: number | null,
  field: keyof Cluster,
) => find(clusters, (cluster) => cluster.id === clusterId)?.[field]

export const formatFiles = (
  files: ProjectAllVersionsFiles[] = [],
  project_id: number,
) => {
  const sortedFiles =
    files?.sort((file1, file2) => file1.version - file2.version) ?? []

  return flatMap(sortedFiles, (file) =>
    map(file.files, (crtFile) => {
      return {
        ...crtFile,
        editable: crtFile.editable && file.id === project_id,
      }
    }),
  )
}

export const canViewField = (viewableFields: string[], field: string) =>
  viewableFields.includes(field)

export const canEditField = (editableFields: string[], field: string) =>
  editableFields.includes(field)

export const hasFields = (
  projectFields: any,
  viewableFields: string[],
  section: string,
  includeAllFields: boolean = true,
  excludedFields?: string[],
  fieldToCheck: string = 'section',
) => {
  const allFields = isArray(projectFields) ? projectFields : projectFields?.data

  const fields = filter(viewableFields, (field) => {
    const crtFieldData = find(
      allFields,
      (projField) =>
        projField.write_field_name === field && field !== 'sort_order',
    )

    return (
      crtFieldData?.[fieldToCheck] === section &&
      (includeAllFields ? true : !excludedFields?.includes(field))
    )
  })

  return fields.length > 0
}

export const pluralizeWord = (data: any[] = [], word: string) =>
  data.length > 1 ? word + 's' : word

export const formatProjectFields = (projectFields: any) =>
  isArray(projectFields) ? projectFields : projectFields?.data

export const defaultOldFields = (
  data: any,
  specificFieldsAvailable: string[],
  projectFields: ProjectSpecificFields[],
) => {
  const oldSpecificFieldsValues = omit(data, [
    ...specificFieldsAvailable,
    'ods_odp',
  ])
  const oldFields = projectFields.filter((field) =>
    keys(oldSpecificFieldsValues).includes(field.write_field_name),
  )

  return getDefaultValues<ProjectTypeApi>(oldFields)
}

const getCrtProjectSpecificFields = (
  filteredFields: ProjectSpecificFields[],
  projectData: ProjectData,
  specificFieldsAvailable: string[],
) => {
  const { projectSpecificFields } = projectData

  const booleanFields = filter(
    filteredFields,
    (field) => field.data_type === 'boolean',
  )
  const booleanFieldsAvailable = map(booleanFields, 'write_field_name')
  const booleanNullFields = difference(
    booleanFieldsAvailable,
    keys(projectSpecificFields),
  )
  const booleanNullValues = fromPairs(
    booleanNullFields.map((field) => [field, false]),
  )

  return {
    ...pick(projectSpecificFields, specificFieldsAvailable),
    ...booleanNullValues,
  }
}

export const filterClusterOptions = (
  clusters: Cluster[],
  canViewProdProjects: boolean,
) => filter(clusters, (cluster) => canViewProdProjects || !cluster.production)

export const getPaginationSelectorOpts = (
  count: number,
  maxResults: number,
) => {
  const actualMaxResults = min([count, maxResults]) ?? maxResults

  const nrResultsOpts = [50, 100, 150, 200, 250, 500, 1000]
  const filteredNrResultsOptions = nrResultsOpts.filter(
    (option) => option <= actualMaxResults,
  )

  return count < maxResults
    ? [...filteredNrResultsOptions, count]
    : filteredNrResultsOptions
}

export const getPaginationPageSize = (count: number, nrEntries?: number) => {
  const entriesPerPage = nrEntries ?? PROJECTS_PER_PAGE
  return min([count, entriesPerPage])
}

export const getAreFiltersApplied = (filters: Record<string, any>) =>
  Object.values(filters).find(
    (filter) => Array.isArray(filter) && filter.length > 0,
  )

export const formatEntity = (currentEntity: any = [], field: string = 'id') =>
  new Map<number, any>(
    currentEntity.map((entity: any) => [entity[field], entity]),
  )

export const getFieldData = (
  data: ProjectSpecificFields[],
  fieldName: string,
) => find(data, (field) => field.write_field_name === fieldName)

export const getHistoryItemValue = (value: any, fieldName: string): any => {
  if (lowerCase(fieldName).includes('date') && dayjs(value).isValid()) {
    return dayjs(value).format('DD/MM/YYYY')
  } else if (
    value &&
    typeof value === 'object' &&
    value.hasOwnProperty('title')
  ) {
    return value.title
  } else if (
    value &&
    typeof value === 'object' &&
    value.hasOwnProperty('name')
  ) {
    return value.name
  } else if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  } else if (Array.isArray(value)) {
    return value.map((v) => getHistoryItemValue(v, fieldName)).join(', ') || '-'
  }
  return value
}

export const filterHistoryField = (history: ProjectFieldHistoryValue[]) =>
  history.filter(
    ({ version, post_excom_meeting }) => version === 3 || !!post_excom_meeting,
  )

export const getLatesValueByMeeting = (history: ProjectFieldHistoryValue[]) =>
  Object.values(
    history.reduce(
      (acc, item) => {
        const key = item.post_excom_meeting ?? '-'
        if (!acc[key] || item.version > acc[key].version) {
          acc[key] = item
        }
        return acc
      },
      {} as Record<string, any>,
    ),
  ).sort((a, b) => b.version - a.version)

export const hasExcomUpdate = (
  history: ProjectFieldHistoryValue[],
  fieldName: string,
) => {
  const filteredHistory = filterHistoryField(history)
  const latestByMeeting = getLatesValueByMeeting(filteredHistory)

  const historicValues =
    latestByMeeting.reduce((acc, item) => {
      acc.add(getHistoryItemValue(item.value, fieldName))
      return acc
    }, new Set()) ?? new Set()

  return historicValues.size > 1
}

export const getFormattedDate = (value: string) =>
  value ? dayjs(value).format('DD/MM/YYYY') : '-'

export const getFormattedNumericValue = (value: string, digits: number = 2) =>
  !isNil(value)
    ? formatDecimalValue(parseFloat(value), {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      })
    : '-'

export const handleChangeNumericValues = (
  event: ChangeEvent<HTMLInputElement>,
  field: string,
  sectionIdentifier: keyof ProjectData,
  setProjectData: SetProjectData,
) => {
  const initialValue = event.target.value
  const value = initialValue === '' ? null : initialValue

  if (!isNaN(Number(value))) {
    setProjectData(
      (prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          [field]: value,
        },
      }),
      field,
    )
  } else {
    event.preventDefault()
  }
}

export const filterApprovalFields = (
  specificFields: ProjectSpecificFields[],
  field: ProjectSpecificFields,
) => {
  const odsOdpFields = getOdsOdpFields(specificFields)
  const odsOdpFieldsNames = map(odsOdpFields, 'write_field_name') as string[]

  const mappedField = approvalToOdsMap[field.write_field_name]

  return (
    field.section === 'Approval' &&
    (field.table !== 'ods_odp' ||
      (mappedField && odsOdpFieldsNames.includes(mappedField)))
  )
}

export const formatFieldLabel = (label: string) =>
  label.replace(/(?<=CO)2/g, '₂')

export const onTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
  setTimeout(() => {
    const element = e.target
    const textLength = element.value.length
    element.setSelectionRange(textLength, textLength)
  })
}

export const getTransferFieldLabel = (
  project: ProjectTypeApi,
  field: string,
) => {
  const isFromTransfer = !!project?.transferred_from
  const formattedField = isFromTransfer ? 'transfer_' + field : field
  const fieldLabel = tableColumns[formattedField]

  if (isFromTransfer && project?.status === 'Transferred') {
    return 'Initial ' + lowerCase(fieldLabel)
  }

  return fieldLabel
}

export const getOdsOdpFields = (specificFields: ProjectSpecificFields[]) => {
  const groupedFields = groupBy(specificFields, 'table')
  return (groupedFields['ods_odp'] || []).filter(
    (field) => field.read_field_name !== 'sort_order',
  )
}

export const getPostExcomMeetingErrors = (projIdentifiers: ProjIdentifiers) =>
  (getMeetingNr(projIdentifiers.post_excom_meeting ?? undefined) ?? 0) <
  (getMeetingNr(projIdentifiers.meeting ?? undefined) ?? 0)

export const getConsumptionLevelStatus = (
  countries: Country[],
  countryId: number,
  consumptionLevelStatuses: OptionsType[],
) => {
  const isLvc = find(countries, { id: countryId })?.is_lvc ?? null

  const lvcToConsumptionMapping: Record<string, string> = {
    true: 'LVC',
    false: 'Non-LVC',
  }

  if (isNull(isLvc)) {
    return isLvc
  }

  return (
    find(consumptionLevelStatuses, {
      id: lvcToConsumptionMapping[String(isLvc)],
    })?.name ?? null
  )
}

export const getProjectDuration = (project: {
  project_start_date: string | null
  project_end_date: string | null
}) => {
  const { project_start_date, project_end_date } = project

  if (!project_start_date || !project_end_date) {
    return null
  }
  const startDate = dayjs(project_start_date)
  const endDate = dayjs(project_end_date)
  const months = endDate.diff(startDate, 'month', true)

  return String(Math.max(Math.ceil(months), 0))
}

export const getFieldExtraLabel = (
  displayExtraLabel: boolean | undefined,
  label: string,
) => (displayExtraLabel && !label.includes('- planned') ? ' - planned' : '')

const getDecisionAndRevision = (decision: string) => {
  const allNumbers = decision.match(/\d+/g)?.map(Number) ?? []

  const revMatch = decision.match(/Rev\.?(\d+)/i)
  const revisionNr = revMatch ? Number(revMatch[1]) : 0

  const decisionNr =
    allNumbers.length > 0
      ? allNumbers[allNumbers.length - (revisionNr ? 2 : 1)]
      : 0

  return { decisionNr, revisionNr }
}

const getOldFormatOrder = (decision: string) => {
  const { decisionNr, revisionNr } = getDecisionAndRevision(decision)

  const paragraphMatch = decision.match(/paragraphs?\s+([\d\sand,]+)/i)
  const paragraphNrs = paragraphMatch
    ? paragraphMatch[1]
        .split(/and|,/)
        .map((n) => Number(n.trim()))
        .filter((n) => !isNaN(n))
    : []

  return [decisionNr, revisionNr, ...paragraphNrs]
}

const getNewFormatOrder = (decision: string) => {
  const { decisionNr, revisionNr } = getDecisionAndRevision(decision)

  return [decisionNr, revisionNr]
}

export const orderDecisions = (decision: string) =>
  decision.toLowerCase().includes('paragraph')
    ? getOldFormatOrder(decision)
    : getNewFormatOrder(decision)

export const isOtherOdsReplacement = (
  opts: OptionsType[],
  value: number | null,
) => {
  const crtOdsReplacementName = find(opts, (opt) => opt.id === value)?.name
  return crtOdsReplacementName?.includes('Other alternatives') ?? false
}

export const formatMetaprojectData = (
  metaprojectData: MetaProjectDetailType | null,
) => {
  const result = {} as Record<string, any>

  if (!metaprojectData) {
    return result
  }

  const fd = metaprojectData.field_data ?? {}
  const cfd = metaprojectData.computed_field_data ?? {}

  for (const key of Object.keys(fd)) {
    const fdEntry = fd[key]

    const fdValue = fdEntry.value
    const computedValue = cfd[key]
    const finalValue = fdValue === null ? computedValue : fdValue

    result[key] =
      fdEntry.type === 'DecimalField'
        ? getFormattedDecimalValue(finalValue as string)
        : finalValue
  }

  return result
}
