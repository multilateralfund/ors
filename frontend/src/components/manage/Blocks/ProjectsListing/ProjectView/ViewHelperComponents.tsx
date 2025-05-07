import { formatDecimalValue } from '@ors/helpers'
import dayjs from 'dayjs'

export const detailItem = (
  fieldName: string,
  fieldValue: string,
  className?: string,
) => (
  <span className="flex items-center gap-2">
    <span className={className}>{fieldName}</span>
    <h4 className="m-0">{fieldValue || '-'}</h4>
  </span>
)

export const numberDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex items-center gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {fieldValue
        ? formatDecimalValue(parseFloat(fieldValue), {
            maximumFractionDigits: 10,
            minimumFractionDigits: 2,
          })
        : '0.00'}
    </h4>
  </span>
)

export const booleanDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex items-center gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">{fieldValue ? 'Yes' : 'No'}</h4>
  </span>
)

export const dateDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex items-center gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {(fieldValue && dayjs(fieldValue).format('MM/DD/YYYY')) || '-'}
    </h4>
  </span>
)
