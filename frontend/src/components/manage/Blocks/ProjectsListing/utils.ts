import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import {
  ProjIdentifiers,
  ProjectSpecificFields,
  ProjectData,
  CrossCuttingFields,
} from './interfaces'
import { formatDecimalValue } from '@ors/helpers'

import { filter, find, isArray, isNil, map, omit, pickBy, reduce } from 'lodash'
import { ITooltipParams, ValueGetterParams } from 'ag-grid-community'

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
            ? find(formatOptions(field), {
                name: data[field.read_field_name as keyof T]?.toString(),
              })?.id
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
  params: ValueGetterParams | ITooltipParams,
  field: string,
  valueFormatter?: {
    maximumFractionDigits: number
    minimumFractionDigits: number
  },
) => {
  const value = params.data[field]

  return value
    ? valueFormatter
      ? formatDecimalValue(parseFloat(value), valueFormatter)
      : formatDecimalValue(parseFloat(value))
    : '0.00'
}

export const handleChangeNumberField = <T, K>(
  event: ChangeEvent<HTMLInputElement>,
  field: keyof K,
  setState: Dispatch<SetStateAction<T>>,
  section: keyof T,
) => {
  const value = event.target.value

  if (!isNaN(Number(value)) && Number.isInteger(Number(value))) {
    setState((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value.trim() !== '' ? Number(value) : '',
      },
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
      [section]: {
        ...prevData[section],
        [field]: value.trim() !== '' ? Number(value) : '',
      },
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
    agency: projIdentifiers.current_agency,
    lead_agency: projIdentifiers?.is_lead_agency
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
