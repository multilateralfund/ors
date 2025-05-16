import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { OdsOdpFields, ProjectSpecificFields } from './interfaces'
import { formatDecimalValue } from '@ors/helpers'

import { filter, find, isArray, map, reduce } from 'lodash'
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

export const handleChangeNumberField = <T>(
  event: ChangeEvent<HTMLInputElement>,
  field: keyof T,
  setState: Dispatch<SetStateAction<T>>,
) => {
  const value = event.target.value

  if (!isNaN(Number(value)) && Number.isInteger(Number(value))) {
    setState((prevFilters) => ({
      ...prevFilters,
      [field]: value.trim() !== '' ? Number(value) : '',
    }))
  } else {
    event.preventDefault()
  }
}

export const handleChangeDecimalField = <T>(
  event: ChangeEvent<HTMLInputElement>,
  field: keyof T,
  setState: Dispatch<SetStateAction<T>>,
) => {
  const value = event.target.value

  if (!isNaN(Number(value))) {
    setState((prevFilters) => ({
      ...prevFilters,
      [field]: value.trim() !== '' ? Number(value) : '',
    }))
  } else {
    event.preventDefault()
  }
}
