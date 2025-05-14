import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { formatDecimalValue } from '@ors/helpers'

import { isEqual, isObject } from 'lodash'

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

export const isOptionEqualToValueByValue = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.value === value

export const handleChangeNumberField = (
  event: ChangeEvent<HTMLInputElement>,
  field: string,
  setState: Dispatch<SetStateAction<any>>,
) => {
  const value = event.target.value

  if (
    value.trim() !== '' &&
    !isNaN(Number(value)) &&
    Number.isInteger(Number(value))
  ) {
    setState((prevFilters: any) => ({
      ...prevFilters,
      [field]: Number(event.target.value),
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

  if (value.trim() !== '' && !isNaN(Number(value))) {
    setState((prevFilters: any) => ({
      ...prevFilters,
      [field]: Number(event.target.value),
    }))
  } else {
    event.preventDefault()
  }
}
