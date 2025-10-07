import type { ProjectFieldHistoryValue } from '@ors/types/store'
import { DetailItemClassname, FieldType, ViewModesHandler } from '../interfaces'
import { formatDecimalValue } from '@ors/helpers'

import FieldHistoryIndicator from '@ors/components/ui/FieldHistoryIndicator/FieldHistoryIndicator'

import { capitalize, find, isBoolean, isNil } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'

export type detailItemExtra = {
  detailClassname?: string
  classNames?: DetailItemClassname
  fieldHistory?: ProjectFieldHistoryValue[]
}

export const detailItem = (
  fieldName: string,
  fieldValue: string,
  extra?: detailItemExtra,
) => {
  const { detailClassname, classNames, fieldHistory = [] } = extra ?? {}
  const {
    containerClassName = '',
    className = '',
    fieldClassName = '',
  } = classNames ?? {}

  return (
    <span className={cx('flex items-center gap-2', containerClassName)}>
      <span className={cx(detailClassname, className)}>{fieldName}</span>
      <h4 className={cx('m-0', fieldClassName)}>{fieldValue ?? '-'}</h4>
      <FieldHistoryIndicator history={fieldHistory} />
    </span>
  )
}

export const numberDetailItem = (
  fieldName: string,
  fieldValue: string,
  fieldHistory?: detailItemExtra['fieldHistory'],
) => (
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
    <FieldHistoryIndicator history={fieldHistory} />
  </span>
)

export const booleanDetailItem = (
  fieldName: string,
  fieldValue: boolean,
  fieldHistory?: detailItemExtra['fieldHistory'],
) => (
  <span className="flex items-center gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">{fieldValue ? 'Yes' : 'No'}</h4>
    <FieldHistoryIndicator history={fieldHistory} />
  </span>
)

export const dateDetailItem = (
  fieldName: string,
  fieldValue: string,
  fieldHistory?: detailItemExtra['fieldHistory'],
) => (
  <span className="flex items-center gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {(fieldValue && dayjs(fieldValue).format('MM/DD/YYYY')) || '-'}
    </h4>
    <FieldHistoryIndicator history={fieldHistory} />
  </span>
)

export const viewModesHandler: Record<FieldType, ViewModesHandler> = {
  text: (data, field, classNames, fieldHistory) =>
    detailItem(capitalize(field.label), data[field.read_field_name], {
      detailClassname: 'self-start',
      classNames,
      fieldHistory,
    }),
  number: (data, field, _, fieldHistory) =>
    detailItem(field.label, data[field.read_field_name], { fieldHistory }),
  decimal: (data, field, _, fieldHistory) =>
    numberDetailItem(field.label, data[field.read_field_name], fieldHistory),
  drop_down: (data, field, _, fieldHistory) => {
    const readFieldName = field.read_field_name
    const updatedFieldName =
      readFieldName === 'decision' ? 'decision_id' : readFieldName

    const value = data[updatedFieldName]
    const formattedValue = isBoolean(value)
      ? find(field.options, { id: data[field.write_field_name] })?.name || '-'
      : value

    return detailItem(field.label, formattedValue, { fieldHistory })
  },
  boolean: (data, field, _, fieldHistory) =>
    booleanDetailItem(field.label, data[field.read_field_name], fieldHistory),
  date: (data, field, _, fieldHistory) =>
    dateDetailItem(field.label, data[field.read_field_name], fieldHistory),
}
