import { validationFieldsPairs } from './constants'
import {
  ProjIdentifiers,
  ProjectSpecificFields,
  ProjectData,
  CrossCuttingFields,
  SpecificFields,
  ProjectTypeApi,
} from './interfaces'
import { formatDecimalValue } from '@ors/helpers'

import {
  capitalize,
  filter,
  find,
  isArray,
  isNaN,
  isNil,
  lowerCase,
  map,
  omit,
  pick,
  pickBy,
  reduce,
} from 'lodash'
import {
  ITooltipParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community'
import dayjs from 'dayjs'

const getFieldId = <T>(field: ProjectSpecificFields, data: T) => {
  const fieldName = field.read_field_name === 'group' ? 'name_alt' : 'name'

  return find(formatOptions(field), {
    [fieldName]: data[field.read_field_name as keyof T]?.toString(),
  })?.id
}

export const getDefaultValues = <T>(
  fields: ProjectSpecificFields[],
  data?: T,
) =>
  reduce(
    fields,
    (acc: any, field) => {
      if (data) {
        acc[field.write_field_name] =
          field.data_type === 'drop_down'
            ? getFieldId<T>(field, data)
            : data[field.write_field_name]
      } else {
        acc[field.write_field_name] = ['drop_down', 'boolean'].includes(
          field.data_type,
        )
          ? null
          : ''
      }
      return acc
    },
    {},
  )

export const canGoToSecondStep = (projIdentifiers: ProjIdentifiers) =>
  !!(
    projIdentifiers.country &&
    projIdentifiers.meeting &&
    projIdentifiers.cluster &&
    ((projIdentifiers.is_lead_agency && projIdentifiers.current_agency) ||
      (!projIdentifiers.is_lead_agency && projIdentifiers.side_agency))
  )

export const getIsSubmitDisabled = (
  projIdentifiers: ProjIdentifiers,
  crossCuttingFields: CrossCuttingFields,
) => {
  const canLinkToBp = canGoToSecondStep(projIdentifiers)
  const { project_type, sector, title } = crossCuttingFields

  return !canLinkToBp || !(project_type && sector && title)
}

export const formatOptions = (field: ProjectSpecificFields) =>
  map(field.options, (option) =>
    isArray(option) ? { id: option[0], name: option[1] } : option,
  )

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

export const formatSubmitData = (
  projectData: ProjectData,
  specificFields: ProjectSpecificFields[],
) => {
  const {
    projIdentifiers,
    bpLinking,
    crossCuttingFields,
    projectSpecificFields,
  } = projectData

  const specificFieldsAvailable = map(
    specificFields,
    ({ write_field_name }) => write_field_name,
  )

  const crtProjectSpecificFields = pick(
    projectSpecificFields,
    specificFieldsAvailable,
  )

  const crtOdsOdpFields = map(projectSpecificFields.ods_odp, (field) =>
    pick(field, specificFieldsAvailable),
  )

  return {
    agency: projIdentifiers?.is_lead_agency
      ? projIdentifiers.current_agency
      : projIdentifiers.side_agency,
    ...omit(projIdentifiers, [
      'current_agency',
      'side_agency',
      'is_lead_agency',
    ]),
    bp_activity: bpLinking.bpId,
    ...pickBy(crossCuttingFields, (value) => !isNil(value) && value !== ''),
    ...pickBy(
      crtProjectSpecificFields,
      (value) => !isNil(value) && value !== '',
    ),
    ods_odp: map(crtOdsOdpFields, (ods_odp) =>
      omit(
        pickBy(ods_odp, (value) => !isNil(value) && value !== ''),
        'id',
      ),
    ),
  }
}

export const getProjIdentifiersErrors = (
  projIdentifiers: ProjIdentifiers,
  errors: { [key: string]: [] },
) => {
  const requiredFields = ['country', 'meeting', 'agency', 'cluster']

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => requiredFields.includes(key)),
  )

  const { current_agency, side_agency, is_lead_agency } = projIdentifiers

  return {
    ...requiredFields.reduce((acc: any, field) => {
      acc[field] = !projIdentifiers[field as keyof ProjIdentifiers]
        ? ['This field may not be null.']
        : []

      return acc
    }, {}),
    agency:
      (is_lead_agency && !current_agency) || (!is_lead_agency && !side_agency)
        ? ['This field may not be null.']
        : [],
    ...filteredErrors,
  }
}

export const getCrossCuttingErrors = (
  crossCuttingFields: CrossCuttingFields,
  errors: { [key: string]: [] },
) => {
  const requiredFields = [
    'project_type',
    'sector',
    'title',
    'subsector_ids',
    'is_lvc',
    'description',
    'total_fund',
    'support_cost_psc',
    'project_start_date',
    'project_end_date',
  ]

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => requiredFields.includes(key)),
  )

  const { project_start_date, project_end_date } = crossCuttingFields

  return {
    ...requiredFields.slice(0, 3).reduce((acc: any, field) => {
      acc[field] = !crossCuttingFields[field as keyof CrossCuttingFields]
        ? ['This field is required.']
        : []

      return acc
    }, {}),
    project_end_date: dayjs(project_end_date).isBefore(
      dayjs(project_start_date),
    )
      ? ['Start date cannot be later than end date.']
      : [],
    ...filteredErrors,
  }
}

export const getDefaultImpactErrors = (
  projectSpecificFields: SpecificFields,
) => {
  const errorMsg = 'Number cannot be greater than the total one.'

  return Object.fromEntries(
    validationFieldsPairs.map(([key, totalKey]) => [
      key,
      (projectSpecificFields[key] ?? 0) > (projectSpecificFields[totalKey] ?? 0)
        ? [errorMsg]
        : [],
    ]),
  )
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
) => {
  const defaultImpactErrors =
    getDefaultImpactErrors(projectSpecificFields) ?? {}
  const updatedErrors = { ...defaultImpactErrors, ...errors }

  const fieldNames = map(specificFields, 'write_field_name') as string[]

  const filteredErrors = Object.entries(updatedErrors)
    .filter(([key]) => fieldNames.includes(key))
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
  const res = await fetch(fileMeta.download_url)

  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.statusText}`)
  }

  const blob = await res.blob()

  const contentType =
    res.headers.get('Content-Type') || 'application/octet-stream'

  return new File([blob], fileMeta.filename, { type: contentType })
}

export const getTitleExtras = (project: ProjectTypeApi) => {
  const { submission_status, version, code, code_legacy } = project

  const status = lowerCase(submission_status)
  const formattedStatus = capitalize(status)

  return (() => {
    switch (true) {
      case status === 'approved':
        return `, ${code ?? code_legacy} (${formattedStatus})`
      case status === 'withdrawn':
        return ` (${formattedStatus})`
      case status === 'draft' && version === 1:
        return ` (${formattedStatus})`
      case status === 'submitted' && version === 2:
        return ` (${formattedStatus})`
      case status === 'recommended' && version === 3:
        return ` (${formattedStatus})`
      default:
        return ''
    }
  })()
}
