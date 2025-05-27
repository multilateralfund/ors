import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import {
  ProjIdentifiers,
  ProjectSpecificFields,
  ProjectData,
  CrossCuttingFields,
  SpecificFields,
} from './interfaces'
import { formatDecimalValue } from '@ors/helpers'

import {
  filter,
  find,
  isArray,
  isNaN,
  isNil,
  map,
  omit,
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

export const handleChangeNumberField = <T, K>(
  event: ChangeEvent<HTMLInputElement>,
  field: keyof K,
  setState: Dispatch<SetStateAction<T>>,
  section: keyof T,
) => {
  const value = event.target.value

  if (!isNaN(parseInt(value))) {
    setState((prevData) => ({
      ...prevData,
      [section]: { ...prevData[section], [field]: parseInt(value) },
    }))
  } else {
    event.preventDefault()
  }
}

export const handleChangeDecimalField = <T, K>(
  event: ChangeEvent<HTMLInputElement>,
  field: keyof K,
  setState: Dispatch<SetStateAction<T>>,
  section: keyof T,
) => {
  const value = event.target.value

  if (!isNaN(Number(value))) {
    setState((prevData) => ({
      ...prevData,
      [section]: { ...prevData[section], [field]: value },
    }))
  } else {
    event.preventDefault()
  }
}

export const formatSubmitData = (projectData: ProjectData) => {
  const {
    projIdentifiers,
    bpLinking,
    crossCuttingFields,
    projectSpecificFields,
  } = projectData

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
    ...pickBy(projectSpecificFields, (value) => !isNil(value) && value !== ''),
    ods_odp: map(projectSpecificFields.ods_odp, (ods_odp) =>
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
  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) =>
      ['country', 'meeting', 'agency', 'cluster'].includes(key),
    ),
  )

  const {
    country,
    meeting,
    current_agency,
    cluster,
    side_agency,
    is_lead_agency,
  } = projIdentifiers

  return {
    country: !country ? ['This field may not be null.'] : [],
    meeting: !meeting ? ['This field may not be null.'] : [],
    agency:
      (is_lead_agency && !current_agency) || (!is_lead_agency && !side_agency)
        ? ['This field may not be null.']
        : [],
    cluster: !cluster ? ['This field may not be null.'] : [],
    ...filteredErrors,
  }
}

export const getCrossCuttingErrors = (
  crossCuttingFields: CrossCuttingFields,
  errors: { [key: string]: [] },
) => {
  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) =>
      [
        'project_type',
        'sector',
        'subsector_ids',
        'is_lvc',
        'title',
        'description',
        'total_fund',
        'support_cost_psc',
        'project_start_date',
        'project_end_date',
      ].includes(key),
    ),
  )

  const { project_type, sector, title, project_start_date, project_end_date } =
    crossCuttingFields

  return {
    project_type: !project_type ? ['This field is required.'] : [],
    sector: !sector ? ['This field is required.'] : [],
    title: !title ? ['This field is required.'] : [],
    project_start_date: dayjs(project_start_date).isAfter(
      dayjs(project_end_date),
    )
      ? ['Start date cannot be later than end date.']
      : [],
    project_end_date: dayjs(project_end_date).isBefore(
      dayjs(project_start_date),
    )
      ? ['End date cannot be earlier than start date.']
      : [],
    ...filteredErrors,
  }
}

export const getSpecificFieldsErrors = (
  projectSpecificFields: SpecificFields,
  specificFields: ProjectSpecificFields[],
  errors: { [key: string]: [] },
) => {
  const errorMsg = 'Number cannot be greater than the total one.'

  const fieldsPairs: [
    keyof typeof projectSpecificFields,
    keyof typeof projectSpecificFields,
  ][] = [
    [
      'number_of_female_technicians_trained',
      'total_number_of_technicians_trained',
    ],
    ['number_of_female_trainers_trained', 'total_number_of_trainers_trained'],
    [
      'number_of_female_technicians_certified',
      'total_number_of_technicians_certified',
    ],
    [
      'number_of_female_customs_officers_trained',
      'total_number_of_customs_officers_trained',
    ],
    [
      'number_of_female_nou_personnel_supported',
      'total_number_of_nou_personnnel_supported',
    ],
  ]

  const defaultErrors = Object.fromEntries(
    fieldsPairs.map(([key, totalKey]) => [
      key,
      (projectSpecificFields[key] ?? 0) > (projectSpecificFields[totalKey] ?? 0)
        ? [errorMsg]
        : [],
    ]),
  )

  const updatedErrors = { ...defaultErrors, ...errors }
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
          if (!acc[section]) acc[section] = {}
          acc[section][label || key] = errMsg
        }

        return acc
      },
      {} as Record<string, Record<string, any>>,
    )

  return filteredErrors
}
