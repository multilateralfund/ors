import { tableColumns, validationFieldsPairs } from './constants'
import {
  ProjIdentifiers,
  ProjectSpecificFields,
  ProjectData,
  CrossCuttingFields,
  SpecificFields,
  ProjectFilesObject,
  ProjectFile,
  OptionsType,
} from './interfaces'
import { formatDecimalValue } from '@ors/helpers'

import {
  concat,
  filter,
  find,
  get,
  isArray,
  isNaN,
  isNil,
  map,
  omit,
  pick,
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
            : field.data_type === 'boolean'
              ? (data[field.write_field_name] ?? false)
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

export const getIsSaveDisabled = (
  projIdentifiers: ProjIdentifiers,
  crossCuttingFields: CrossCuttingFields,
) => {
  const canLinkToBp = canGoToSecondStep(projIdentifiers)
  const { project_type, sector, title } = crossCuttingFields

  return !canLinkToBp || !(project_type && sector && title)
}

export const formatOptions = (field: ProjectSpecificFields): OptionsType[] => {
  const options = field.options as
    | OptionsType[]
    | Record<'substances' | 'blends', OptionsType[]>

  return field.write_field_name === 'ods_display_name' && !isArray(options)
    ? concat(options.substances, options.blends).map((option) => {
        return { ...option, id: `${option.baseline_type}-${option.id}` }
      })
    : map(options, (option) =>
        isArray(option) ? { id: option[0], name: option[1] } : option,
      )
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
  const specificFieldsAvailable = map(specificFields, 'write_field_name')

  const crtProjectSpecificFields = pick(
    projectSpecificFields,
    specificFieldsAvailable,
  )

  const crtOdsOdpFields = map(projectSpecificFields.ods_odp, (field, index) => {
    const odsDisplayName = get(field, 'ods_display_name') ?? ''
    const baselineTechValue = odsDisplayName.split('-')?.[1]
    const baselineTechObj = odsDisplayName.includes('substance')
      ? { ods_substance_id: baselineTechValue, ods_blend_id: null }
      : { ods_substance_id: null, ods_blend_id: baselineTechValue }

    return {
      ...omit(pick(field, specificFieldsAvailable), 'ods_display_name'),
      ...baselineTechObj,
      sort_order: index + 1,
    }
  })

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
    ...crossCuttingFields,
    ...crtProjectSpecificFields,
    ods_odp: map(crtOdsOdpFields, (ods_odp) => omit(ods_odp, 'id')),
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
        ? ['This field is required.']
        : []

      return acc
    }, {}),
    agency:
      (is_lead_agency && !current_agency) || (!is_lead_agency && !side_agency)
        ? ['This field is required.']
        : [],
    ...filteredErrors,
  }
}

export const checkInvalidValue = (value: any) =>
  isNil(value) || value === '' || value.length === 0

const getFieldErrors = (fields: string[], data: any) =>
  fields.reduce((acc: any, field) => {
    acc[field] = checkInvalidValue(data[field as keyof typeof fields])
      ? ['title', 'project_type', 'sector'].includes(field)
        ? ['This field is required.']
        : ['This field is required for submission.']
      : []

    return acc
  }, {})

export const getCrossCuttingErrors = (
  crossCuttingFields: CrossCuttingFields,
  errors: { [key: string]: [] },
  mode: string,
) => {
  const requiredFields = [
    'title',
    'project_type',
    'sector',
    'description',
    'subsector_ids',
    'is_lvc',
    'total_fund',
    'support_cost_psc',
    'project_start_date',
    'project_end_date',
  ]

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => requiredFields.includes(key)),
  )

  const { project_start_date, project_end_date } = crossCuttingFields

  const fieldsToCheck =
    mode === 'edit' ? requiredFields : requiredFields.slice(0, 3)

  return {
    ...getFieldErrors(fieldsToCheck, crossCuttingFields),
    ...(dayjs(project_end_date).isBefore(dayjs(project_start_date)) && {
      project_end_date: ['Start date cannot be later than end date.'],
    }),
    ...filteredErrors,
  }
}

export const getDefaultImpactErrors = (
  projectSpecificFields: SpecificFields,
) => {
  const errorMsg = 'Number cannot be greater than the total one.'

  return Object.fromEntries(
    validationFieldsPairs
      .filter(
        ([key, totalKey]) =>
          totalKey in projectSpecificFields &&
          (projectSpecificFields[key] ?? 0) >
            (projectSpecificFields[totalKey] ?? 0),
      )
      .map(([key]) => [key, [errorMsg]]),
  )
}

export const hasSectionErrors = (errors: { [key: string]: string[] }) =>
  Object.values(errors).some((errors) => errors.length > 0)

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
) => {
  const fieldNames = map(
    filter(
      specificFields,
      ({ table, section }) => table === 'project' && section !== 'MYA',
    ),
    'write_field_name',
  ) as string[]

  const defaultImpactErrors =
    getDefaultImpactErrors(projectSpecificFields) ?? {}
  const sectionErrors =
    mode === 'edit'
      ? (getFieldErrors(fieldNames, projectSpecificFields) ?? {})
      : {}
  const updatedErrors = { ...sectionErrors, ...defaultImpactErrors, ...errors }

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

export const formatErrors = (errors: { [key: string]: string[] }) =>
  Object.entries(errors)
    .filter(([, errorMsgs]) => errorMsgs.length > 0)
    .flatMap(([field, errorMsgs]) =>
      errorMsgs.map((errMsg, idx) => ({
        id: `${field}-${idx}`,
        message: `${tableColumns[field] ?? field}: ${errMsg}`,
      })),
    )

export const getHasNoFiles = (
  files?: ProjectFilesObject,
  projectFiles?: ProjectFile[],
) =>
  files?.newFiles?.length === 0 &&
  (projectFiles?.length === 0 ||
    files?.deletedFilesIds?.length === projectFiles?.length)

export const getMenus = (permissions: Record<string, boolean>) => {
  const { canViewBp, canUpdateBp } = permissions

  return [
    {
      title: 'Planning',
      menuItems: [
        {
          title: 'View business plans',
          url: '/business-plans',
          permissions: [canViewBp],
        },
        {
          title: 'New business plan',
          url: '/business-plans/upload',
          permissions: [canUpdateBp],
        },
      ],
    },
    {
      title: 'Approved Projects',
      menuItems: [
        { title: 'Update MYA data', url: null },
        { title: 'Update post ExCom fields', url: null },
        { title: 'Update enterprises', url: null },
        { title: 'Transfer a project', url: null },
      ],
    },
    {
      title: 'Reporting',
      menuItems: [
        { title: 'Create Annual Progress Report', url: null },
        { title: 'Raise a PCR', url: null },
      ],
    },
  ]
}
