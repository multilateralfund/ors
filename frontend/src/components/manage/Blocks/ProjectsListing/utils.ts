import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { formatDecimalValue } from '@ors/helpers'

import { isArray, isEqual, isObject, map } from 'lodash'
import { ProjectSpecificFields } from './interfaces'

export const formatNumberColumns = (
  params: any,
  field: string,
  valueFormatter?: any,
) => {
  const value = params.data[field]

  return value
    ? valueFormatter
      ? formatDecimalValue(parseFloat(value), valueFormatter)
      : formatDecimalValue(parseFloat(value))
    : '0.00'
}

export const handleChangeNumberField = (
  event: ChangeEvent<HTMLInputElement>,
  field: string,
  setState: Dispatch<SetStateAction<any>>,
) => {
  const value = event.target.value

  if (!isNaN(Number(value)) && Number.isInteger(Number(value))) {
    console.log('dana')
    setState((prevFilters: any) => ({
      ...prevFilters,
      [field]: value.trim() !== '' ? Number(value) : '',
    }))
  } else {
    event.preventDefault()
  }
}

export const handleChangeDecimalField = (
  event: ChangeEvent<HTMLInputElement>,
  field: string,
  setState: Dispatch<SetStateAction<any>>,
) => {
  const value = event.target.value

  if (!isNaN(Number(value))) {
    setState((prevFilters: any) => ({
      ...prevFilters,
      [field]: value.trim() !== '' ? Number(value) : '',
    }))
  } else {
    event.preventDefault()
  }
}

export const formatOptions = (field: ProjectSpecificFields) =>
  map(field.options, (option) =>
    isArray(option) ? { id: option[0], name: option[1] } : option,
  )
