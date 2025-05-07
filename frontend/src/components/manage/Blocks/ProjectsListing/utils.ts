import { formatDecimalValue } from '@ors/helpers'

import { isEqual, isObject } from 'lodash'

export const formatNumberColumns = (
  params: any,
  field: string,
  valueFormatter?: any,
) => {
  const value = params.data[field]

  return (
    '$' +
    (value
      ? valueFormatter
        ? formatDecimalValue(parseFloat(value), valueFormatter)
        : formatDecimalValue(parseFloat(value))
      : '0.00')
  )
}

export const isOptionEqualToValueByValue = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.value === value
