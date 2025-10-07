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
  isDisabledImpactField?: boolean
}

export const detailItem = (
  fieldName: string,
  fieldValue: string,
  extra?: detailItemExtra,
) => {
  const {
    detailClassname,
    classNames,
    fieldHistory = [],
    isDisabledImpactField,
  } = extra ?? {}
  const {
    containerClassName = '',
    className = '',
    fieldClassName = '',
  } = classNames ?? {}

  return (
    <div>
      <span
        className={cx('flex items-center gap-2', containerClassName, {
          italic: isDisabledImpactField,
        })}
      >
        <span className={cx(detailClassname, className)}>
          {fieldName}
          {isDisabledImpactField ? ' (planned)' : ''}
        </span>
        <h4 className={cx('m-0', fieldClassName)}>{fieldValue || '-'}</h4>
      </span>
      <FieldHistoryIndicator history={fieldHistory} fieldName={fieldName} />
    </div>
  )
}

export const numberDetailItem = (
  fieldName: string,
  fieldValue: string,
  fieldHistory?: detailItemExtra['fieldHistory'],
  isDisabledImpactField?: boolean,
) => (
  <div>
    <span
      className={cx('flex items-center gap-2', {
        italic: isDisabledImpactField,
      })}
    >
      <span>
        {fieldName} {isDisabledImpactField ? ' (planned)' : ''}
      </span>
      <h4 className="m-0">
        {!isNil(fieldValue)
          ? formatDecimalValue(parseFloat(fieldValue), {
              maximumFractionDigits: 10,
              minimumFractionDigits: 2,
            })
          : '-'}
      </h4>
    </span>
    <FieldHistoryIndicator history={fieldHistory} fieldName={fieldName} />
  </div>
)

export const booleanDetailItem = (
  fieldName: string,
  fieldValue: boolean,
  fieldHistory?: detailItemExtra['fieldHistory'],
  className?: string,
  isDisabledImpactField?: boolean,
) => (
  <div>
    <span
      className={cx('flex items-center gap-2', className, {
        italic: isDisabledImpactField,
      })}
    >
      <span>
        {fieldName} {isDisabledImpactField ? ' (planned)' : ''}
      </span>
      <h4 className="m-0">{fieldValue ? 'Yes' : 'No'}</h4>
    </span>
    <FieldHistoryIndicator history={fieldHistory} fieldName={fieldName} />
  </div>
)

export const dateDetailItem = (
  fieldName: string,
  fieldValue: string,
  fieldHistory?: detailItemExtra['fieldHistory'],
) => (
  <div>
    <span className="flex items-center gap-2">
      <span>{fieldName}</span>
      <h4 className="m-0">
        {(fieldValue && dayjs(fieldValue).format('DD/MM/YYYY')) || '-'}
      </h4>
    </span>
    <FieldHistoryIndicator history={fieldHistory} fieldName={fieldName} />
  </div>
)

export const viewModesHandler: Record<FieldType, ViewModesHandler> = {
  text: (data, field, classNames, fieldHistory) =>
    detailItem(capitalize(field.label), data[field.read_field_name], {
      detailClassname: 'self-start',
      classNames,
      fieldHistory,
    }),
  number: (data, field, _, fieldHistory, hasActualFields) => {
    const isDisabledImpactField =
      field.section === 'Impact' && hasActualFields && !field.is_actual

    return detailItem(field.label, data[field.read_field_name], {
      fieldHistory,
      isDisabledImpactField,
    })
  },
  decimal: (data, field, _, fieldHistory, hasActualFields) => {
    const isDisabledImpactField =
      field.section === 'Impact' && hasActualFields && !field.is_actual

    return numberDetailItem(
      field.label,
      data[field.read_field_name],
      fieldHistory,
      isDisabledImpactField,
    )
  },
  drop_down: (data, field, _, fieldHistory, hasActualFields) => {
    const value = data[field.read_field_name]
    const formattedValue = isBoolean(value)
      ? find(field.options, { id: data[field.write_field_name] })?.name || '-'
      : value

    const isDisabledImpactField =
      field.section === 'Impact' && hasActualFields && !field.is_actual

    return detailItem(field.label, formattedValue, {
      fieldHistory,
      isDisabledImpactField,
    })
  },
  boolean: (data, field, _, fieldHistory, hasActualFields) => {
    const className =
      field.section === 'Impact' ? 'col-span-full flex w-full' : ''
    const isDisabledImpactField =
      field.section === 'Impact' && hasActualFields && !field.is_actual

    return booleanDetailItem(
      field.label,
      data[field.read_field_name],
      fieldHistory,
      className,
      isDisabledImpactField,
    )
  },
  date: (data, field, _, fieldHistory) =>
    dateDetailItem(field.label, data[field.read_field_name], fieldHistory),
}
