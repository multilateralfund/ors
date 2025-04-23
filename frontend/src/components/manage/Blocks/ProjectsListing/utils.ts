import { formatDecimalValue } from '@ors/helpers'

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
