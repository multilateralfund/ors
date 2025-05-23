import { FieldType, ViewModesHandler } from '../interfaces'
import { formatDecimalValue } from '@ors/helpers'

import { find, isBoolean, isNil } from 'lodash'
import dayjs from 'dayjs'

export const detailItem = (
  fieldName: string,
  fieldValue: string,
  className?: string,
) => (
  <span className="flex items-center gap-2">
    <span className={className}>{fieldName}</span>
    <h4 className="m-0">{fieldValue ?? '-'}</h4>
  </span>
)

export const numberDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex items-center gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {!isNil(fieldValue)
        ? formatDecimalValue(parseFloat(fieldValue), {
            maximumFractionDigits: 10,
            minimumFractionDigits: 2,
          })
        : '-'}
    </h4>
  </span>
)

export const booleanDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex items-center gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {isNil(fieldValue) ? '-' : fieldValue ? 'Yes' : 'No'}
    </h4>
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

export const viewModesHandler: Record<FieldType, ViewModesHandler> = {
  text: (data, field) =>
    detailItem(field.label, data[field.read_field_name], 'self-start'),
  number: (data, field) => detailItem(field.label, data[field.read_field_name]),
  decimal: (data, field) =>
    numberDetailItem(field.label, data[field.read_field_name]),
  drop_down: (data, field) => {
    const value = data[field.read_field_name]
    const formattedValue = isBoolean(value)
      ? find(field.options, { id: data[field.write_field_name] })?.name || '-'
      : value

    return detailItem(field.label, formattedValue)
  },
  boolean: (data, field) =>
    booleanDetailItem(field.label, data[field.read_field_name]),
}
