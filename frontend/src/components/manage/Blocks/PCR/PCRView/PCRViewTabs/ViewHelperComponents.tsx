import { getFormattedNumericValue } from '../../../ProjectsListing/utils'
import { DetailItemClassname } from '../../../ProjectsListing/interfaces'

import cx from 'classnames'
import dayjs from 'dayjs'

export type detailItemExtra = {
  detailClassname?: string
  classNames?: DetailItemClassname
}

export const detailItem = (
  fieldName: string,
  fieldValue: string,
  extra?: detailItemExtra,
) => {
  const { detailClassname, classNames } = extra ?? {}
  const {
    containerClassName = '',
    className = '',
    fieldClassName = '',
  } = classNames ?? {}

  return (
    <span className={cx('flex gap-2', containerClassName)}>
      <span className={cx(detailClassname, className)}>{fieldName}</span>
      <h4 className={cx('m-0', fieldClassName)}>{fieldValue || '-'}</h4>
    </span>
  )
}

export const numberDetailItem = (
  fieldName: string,
  fieldValue: string,
  dataType: string,
) => (
  <span className="flex gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {getFormattedNumericValue(fieldValue, dataType === 'decimal' ? 2 : 0)}
    </h4>
  </span>
)

export const booleanDetailItem = (
  fieldName: string,
  fieldValue: boolean | null | undefined,
  className?: string,
) => (
  <span className={cx('flex gap-2', className)}>
    <span>{fieldName}</span>
    <h4 className="m-0">
      {fieldValue == null ? '-' : fieldValue ? 'Yes' : 'No'}
    </h4>
  </span>
)

export const dateDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {(fieldValue && dayjs(fieldValue).format('DD/MM/YYYY')) || '-'}
    </h4>
  </span>
)
